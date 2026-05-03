import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ListingDetailResponseDto } from './dto/listing-detail-response.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('listings') private readonly listingsQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateListingDto) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new ForbiddenException('Apenas vendedores podem criar anúncios.');
    }

    const { photos, ...vehicleData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Vehicle
      const vehicle = await tx.vehicle.create({
        data: {
          sellerId: seller.id,
          versionId: vehicleData.versionId,
          yearFabId: vehicleData.yearFabId,
          color: vehicleData.color,
          plate: vehicleData.plate,
          city: vehicleData.city,
          state: vehicleData.state,
          availableParts: vehicleData.availableParts,
          observations: vehicleData.observations,
          status: 'PENDING',
          photos: {
            create: photos.map((p: any) => ({
              url: p.url,
              order: p.order,
              type: p.type,
            })),
          },
        },
      });

      // 2. Create Listing
      return tx.listing.create({
        data: {
          sellerProfileId: seller.id,
          vehicleId: vehicle.id,
          title: dto.title,
          description: dto.description,
          price: dto.price,
          status: 'PENDING',
        },
      });
    });
  }

  private readonly logger = new Logger(ListingsService.name);

  async findAll(query: any) {
    try {
      this.logger.log('Fetching all published listings...');
      const listings = await this.prisma.listing.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLISHED',
        },
        include: {
          vehicle: {
            include: {
              photos: { where: { order: 0 }, take: 1 },
              version: { include: { model: { include: { brand: true } } } },
            },
          },
        },
      });
      this.logger.log(`Found ${listings.length} listings.`);
      return listings;
    } catch (error) {
      this.logger.error('Error fetching listings:', error.message, error.stack);
      throw error;
    }
  }

  async findOne(id: string, ip: string): Promise<ListingDetailResponseDto> {
    const listing = await this.prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: {
        vehicle: {
          include: {
            photos: {
              orderBy: { order: 'asc' },
            },
            version: {
              include: {
                model: {
                  include: {
                    brand: true,
                  },
                },
              },
            },
            yearFab: true,
          },
        },
        sellerProfile: {
          include: {
            stats: true,
          },
        },
      },
    });

    if (!listing || listing.status !== 'PUBLISHED') {
      throw new NotFoundException(`Anúncio com ID ${id} não encontrado ou foi removido.`);
    }

    // Increment views via BullMQ
    try {
      await this.listingsQueue.add(
        'increment-listing-views',
        { listingId: id, ip },
        { priority: 10, removeOnComplete: true }
      );
    } catch (error) {
      console.error('Failed to add increment-listing-views job:', error);
    }

    const availablePartsIds = Array.isArray(listing.vehicle.availableParts)
      ? (listing.vehicle.availableParts as string[])
      : [];

    // Resolve part categories
    const partCategories = availablePartsIds.length > 0
      ? await this.prisma.partCategory.findMany({
          where: { id: { in: availablePartsIds } },
        })
      : [];
    const pcMap = new Map(partCategories.map((pc) => [pc.id, { name: pc.name, icon: pc.icon }]));

    const availableParts = availablePartsIds
      .map((id) => pcMap.get(id))
      .filter(Boolean) as { name: string; icon: string }[];

    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      views: listing.views,
      favoritesCount: listing.favoritesCount,
      createdAt: listing.createdAt,
      publishedAt: listing.publishedAt,
      vehicle: {
        id: listing.vehicle.id,
        color: listing.vehicle.color,
        city: listing.vehicle.city,
        state: listing.vehicle.state,
        observations: listing.vehicle.observations,
        year: listing.vehicle.yearFab.yearFab,
        modelName: listing.vehicle.version.model.name,
        brandName: listing.vehicle.version.model.brand.name,
        versionName: listing.vehicle.version.name,
        photos: listing.vehicle.photos.map((p) => ({
          id: p.id,
          url: p.url,
          order: p.order,
          type: p.type,
        })),
        availableParts,
      },
      seller: {
        id: (listing as any).sellerProfile.id,
        storeName: (listing as any).sellerProfile.storeName,
        city: (listing as any).sellerProfile.city,
        state: (listing as any).sellerProfile.state,
        avatar: (listing as any).sellerProfile.logo,
        isVerified: (listing as any).sellerProfile.isVerified,
        rating: (listing as any).sellerProfile.stats?.rating ?? null,
      },
    };
  }

  async update(id: string, userId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { sellerProfile: true },
    });

    if (!listing || (listing as any).deletedAt) {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    if (listing.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para alterar este anúncio.');
    }

    const { title, description, price, ...vehicleFields } = dto;
    const { photos, ...directVehicleFields } = vehicleFields as any;

    return this.prisma.listing.update({
      where: { id },
      data: {
        title,
        description,
        price,
        vehicle: Object.keys(directVehicleFields).length > 0 ? {
          update: directVehicleFields
        } : undefined,
      },
    });
  }

  async softDelete(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { sellerProfile: true },
    });

    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    if (listing.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para remover este anúncio.');
    }

    return this.prisma.listing.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'EXPIRED', // Marking as expired/removed from public view
      },
    });
  }
}

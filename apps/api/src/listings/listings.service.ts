import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ListingDetailResponseDto } from './dto/listing-detail-response.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { NotificationService } from '../notifications/notification.service';
import { ListingStatusMachine } from './listing-status.machine';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    @InjectQueue('listings') private readonly listingsQueue: Queue,
  ) {}

  private readonly logger = new Logger(ListingsService.name);

  async findAll(query: { 
    brandId?: string; 
    modelId?: string; 
    city?: string; 
    state?: string;
    partCategoryId?: string;
    page?: string | number;
    limit?: string | number;
  }) {
    try {
      this.logger.log(`Fetching published listings with filters: ${JSON.stringify(query)}`);
      
      const where: any = {
        deletedAt: null,
        status: 'PUBLISHED',
        sellerProfile: {
          deletedAt: null, // Ocultar anúncios se o vendedor correspondente for deletado (LGPD)
        },
      };

      if (query.brandId) where.vehicle = { ...where.vehicle, version: { model: { brandId: query.brandId } } };
      if (query.modelId) where.vehicle = { ...where.vehicle, version: { modelId: query.modelId } };
      if (query.city) where.vehicle = { ...where.vehicle, city: query.city };
      if (query.state) where.vehicle = { ...where.vehicle, state: query.state };
      if (query.partCategoryId) {
        where.vehicle = { 
          ...where.vehicle, 
          availableParts: {
            array_contains: query.partCategoryId
          }
        };
      }

      const page = query.page ? Math.max(1, parseInt(String(query.page), 10)) : undefined;
      const limit = query.limit ? Math.max(1, parseInt(String(query.limit), 10)) : undefined;
      const skip = page && limit ? (page - 1) * limit : undefined;
      const take = limit;

      const listings = await this.prisma.listing.findMany({
        where,
        include: {
          vehicle: {
            include: {
              photos: { where: { order: 0 }, take: 1 },
              version: { include: { model: { include: { brand: true } } } },
              yearFab: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        ...(skip !== undefined && { skip }),
        ...(take !== undefined && { take }),
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
      where: { 
        id, 
        deletedAt: null,
        sellerProfile: {
          deletedAt: null, // Ocultar anúncio se o vendedor correspondente for deletado (LGPD)
        },
      },
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

    const { title, description, ...vehicleFields } = dto;
    const { photos, ...directVehicleFields } = vehicleFields as any;

    ListingStatusMachine.validateTransition(listing.status, 'PENDING');

    const hasVehicleUpdates = Object.keys(directVehicleFields).length > 0 || (photos && photos.length > 0);

    return this.prisma.listing.update({
      where: { id },
      data: {
        title,
        description,
        status: 'PENDING', // RN14: Reset to PENDING on update
        vehicle: hasVehicleUpdates ? {
          update: {
            ...directVehicleFields,
            ...(photos && photos.length > 0 ? {
              photos: {
                deleteMany: {},
                create: photos.map((p: any) => ({
                  url: p.url,
                  order: p.order,
                  type: p.type,
                })),
              },
            } : {}),
          },
        } : undefined,
      },
    });
  }

  async softDelete(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id, deletedAt: null },
      include: { sellerProfile: true },
    });

    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado ou já removido.');
    }

    if (listing.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para remover este anúncio.');
    }

    ListingStatusMachine.validateTransition(listing.status, 'EXPIRED');

    return this.prisma.listing.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'EXPIRED', // Marking as expired/removed from public view
      },
    });
  }

  async markAsSold(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id, deletedAt: null },
      include: { 
        sellerProfile: {
          include: { stats: true }
        }
      },
    });

    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado ou já removido.');
    }

    if (listing.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para marcar este anúncio como vendido.');
    }

    if (listing.status === 'SOLD') {
      return listing;
    }

    ListingStatusMachine.validateTransition(listing.status, 'SOLD');

    const soldAt = new Date();
    const publishedAt = listing.publishedAt || listing.createdAt;
    const diffMinutes = Math.floor((soldAt.getTime() - publishedAt.getTime()) / (1000 * 60));

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Listing and Vehicle status
      const updatedListing = await tx.listing.update({
        where: { id },
        data: {
          status: 'SOLD',
          soldAt,
          vehicle: {
            update: { status: 'SOLD' }
          }
        },
      });

      // 2. Archive all chats for this listing
      await tx.chatRoom.updateMany({
        where: { listingId: id, isActive: true },
        data: {
          isActive: false,
          isArchived: true,
          closedAt: soldAt
        }
      });

      // 3. Update Seller Stats
      const stats = listing.sellerProfile.stats;
      if (stats) {
        const newTotalSold = stats.totalSold + 1;
        const currentAvg = stats.avgTimeToSellMinutes || 0;
        const newAvg = Math.floor((currentAvg * stats.totalSold + diffMinutes) / newTotalSold);

        await tx.sellerStats.update({
          where: { id: stats.id },
          data: {
            totalSold: newTotalSold,
            avgTimeToSellMinutes: newAvg,
            activeListings: { decrement: 1 }
          }
        });
      }

      // 4. Trigger notifications
      await this.notificationService.notifySoldListing(id, listing.title);

      this.logger.log(`Listing ${id} marked as SOLD. Notifications sent to favorites.`);

      return updatedListing;
    });
  }
}

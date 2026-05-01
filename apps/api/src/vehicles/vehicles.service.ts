import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateAvailablePartsDto } from './dto/update-available-parts.dto';
import { ListingStatus, VehicleStatus, PhotoType } from '@prisma/client';
import { StorageService } from '../common/storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  /**
   * Creates a new vehicle and its corresponding listing in an atomic transaction.
   * RN14: Both entities are created with PENDING status for moderation.
   */
  async create(sellerId: string, dto: CreateVehicleDto) {
    const { 
      versionId, 
      yearFabId, 
      availableParts, 
      title, 
      description, 
      ...vehicleData 
    } = dto;

    // Check for potential duplicity (RN10)
    const duplicate = await this.prisma.listing.findFirst({
      where: {
        sellerProfileId: sellerId,
        vehicle: {
          versionId,
          yearFabId,
        },
        status: { in: [ListingStatus.PENDING, ListingStatus.PUBLISHED] },
      },
      select: { id: true },
    });

    const isDuplicate = !!duplicate;
    const duplicateOfId = duplicate?.id || null;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Vehicle
      const vehicle = await tx.vehicle.create({
        data: {
          ...vehicleData,
          versionId,
          yearFabId,
          sellerId,
          availableParts,
          status: VehicleStatus.PENDING,
        },
      });

      // 2. Create Main Listing (The vehicle itself)
      const mainListing = await tx.listing.create({
        data: {
          sellerProfileId: sellerId,
          vehicleId: vehicle.id,
          title,
          description,
          status: ListingStatus.PENDING,
          isDuplicate,
          duplicateOfId,
        },
      });

      // 3. Create individual listings for each part (Desmembramento)
      // We only do this if there are available parts and it's a new vehicle (not duplicate)
      if (availableParts && Array.isArray(availableParts) && availableParts.length > 0 && !isDuplicate) {
        await tx.listing.createMany({
          data: (availableParts as string[]).map((partName) => ({
            sellerProfileId: sellerId,
            vehicleId: vehicle.id,
            title: `${partName} - ${title}`,
            description: `Peça retirada de: ${title}. ${description || ''}`,
            status: ListingStatus.PENDING,
          })),
        });
      }

      return { vehicle, listing: mainListing, warnings: isDuplicate ? ['Anúncio similar já existente.'] : [] };
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        listings: true,
        photos: { orderBy: { order: 'asc' } },
        version: { include: { model: { include: { brand: true } } } },
        yearFab: true,
      } as any,
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    return vehicle;
  }

  /**
   * Updates vehicle and listing.
   * RN14: Every edit forces Listing back to PENDING.
   */
  async update(id: string, sellerId: string, dto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.sellerId !== sellerId) throw new ForbiddenException('Ação não permitida');

    const { title, description, ...vehicleData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const updatedVehicle = await tx.vehicle.update({
        where: { id },
        data: { ...vehicleData, status: VehicleStatus.PENDING },
      });

      const listings = await tx.listing.findMany({ where: { vehicleId: id } });
      const mainListingId = listings[0]?.id;

      let updatedListing = null;
      if (mainListingId) {
        updatedListing = await tx.listing.update({
          where: { id: mainListingId },
          data: { 
            title, 
            description, 
            status: ListingStatus.PENDING,
            publishedAt: null
          },
        });
      }

      return { vehicle: updatedVehicle, listing: updatedListing };
    });
  }

  /**
   * Quick update for available parts.
   * Does NOT trigger re-moderation.
   */
  async updateAvailableParts(id: string, sellerId: string, dto: UpdateAvailablePartsDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.sellerId !== sellerId) throw new ForbiddenException('Ação não permitida');

    return this.prisma.vehicle.update({
      where: { id },
      data: { availableParts: dto.partIds },
    });
  }

  /**
   * Marks a vehicle as SOLD (RN06).
   */
  async markAsSold(id: string, sellerId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.sellerId !== sellerId) throw new ForbiddenException('Ação não permitida');

    return this.prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.SOLD },
      });

      await tx.listing.updateMany({
        where: { vehicleId: id },
        data: { 
          status: ListingStatus.SOLD,
          soldAt: new Date()
        },
      });
    });
  }

  /**
   * Marks a vehicle as REMOVED (Retirado).
   */
  async markAsRemoved(id: string, sellerId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.sellerId !== sellerId) throw new ForbiddenException('Ação não permitida');

    return this.prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.INACTIVE },
      });

      await tx.listing.updateMany({
        where: { vehicleId: id },
        data: { 
          status: ListingStatus.EXPIRED,
        },
      });
    });
  }

  async findBySeller(sellerId: string) {
    return this.prisma.vehicle.findMany({
      where: { sellerId },
      include: { listings: true, photos: { take: 1, orderBy: { order: 'asc' } } } as any,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Returns all active listings for buyers.
   */
  async findAllPublished(filters: { city?: string; state?: string }) {
    const whereClause: any = {
      status: VehicleStatus.ACTIVE,
      listings: {
        some: {
          status: ListingStatus.PUBLISHED,
        },
      },
    };

    if (filters.city) whereClause.city = filters.city;
    if (filters.state) whereClause.state = filters.state;

    return this.prisma.vehicle.findMany({
      where: whereClause,
      include: {
        listings: true,
        photos: { orderBy: { order: 'asc' } },
        version: { include: { model: { include: { brand: true } } } },
        yearFab: true,
      } as any,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Generates upload URLs for vehicle photos.
   */
  async generateUploadUrls(id: string, sellerId: string, count: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.sellerId !== sellerId) throw new ForbiddenException('Ação não permitida');

    const uploadUrls = await Promise.all(
      Array.from({ length: count }, async (_, i) => {
        const path = `vehicles/${id}/photo_${Date.now()}_${i}`;
        const data = await this.storageService.createSignedUploadUrl('vehicle-photos', path);
        return {
          slotIndex: i,
          ...data,
        };
      }),
    );

    return uploadUrls;
  }

  /**
   * Confirms photo uploads and saves them to database.
   */
  async confirmPhotos(id: string, sellerId: string, photos: { url: string; type: PhotoType; order: number }[]) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.sellerId !== sellerId) throw new ForbiddenException('Ação não permitida');

    return this.prisma.vehiclePhoto.createMany({
      data: photos.map((p) => ({
        vehicleId: id,
        url: p.url,
        type: p.type,
        order: p.order,
      })),
    });
  }
}

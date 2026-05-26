import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { UpdateAvailablePartsDto } from './dto/update-available-parts.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { ListingStatus, VehicleStatus, PhotoType } from '@prisma/client';
import { StorageService } from '../common/storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    @InjectQueue('vehicle-photos') private vehiclePhotosQueue: Queue,
  ) {}

  /**
   * Creates a new vehicle and its corresponding listing in an atomic transaction.
   * RN14: Both entities are created with PENDING status for moderation.
   */
  async create(sellerId: string, dto: CreateVehicleDto) {
    const { 
      versionId: initialVersionId, 
      yearFabId: initialYearFabId, 
      availableParts, 
      title, 
      description, 
      plate,
      customBrandName,
      customModelName,
      customVersionName,
      customYearFab,
      customYearModel,
      ...vehicleData 
    } = dto;

    if (!initialVersionId && (!customBrandName || !customModelName || !customVersionName)) {
      throw new BadRequestException('Você deve fornecer os dados de marca, modelo e versão do veículo.');
    }
    if (!initialYearFabId && (!customYearFab || !customYearModel)) {
      throw new BadRequestException('Você deve fornecer os anos de fabricação e modelo do veículo.');
    }

    // Check for duplicate plate (RN10)
    if (plate) {
      const existingVehicle = await this.prisma.vehicle.findFirst({
        where: { plate },
        select: { id: true },
      });
      if (existingVehicle) {
        throw new ConflictException('Já existe um veículo cadastrado com esta placa.');
      }
    }

    const normalizeText = (text: string): string => {
      if (!text) return '';
      return text.trim().replace(/\s+/g, ' ');
    };

    const capitalizeText = (text: string): string => {
      const normalized = normalizeText(text);
      if (!normalized) return '';
      return normalized
        .split(' ')
        .map(word => {
          if (word.length === 0) return '';
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    };

    return this.prisma.$transaction(async (tx) => {
      let resolvedVersionId = initialVersionId;
      let resolvedYearFabId = initialYearFabId;

      // Resolução invisível do catálogo se for customizado
      if (!resolvedVersionId && customBrandName && customModelName && customVersionName) {
        const brandNameNorm = normalizeText(customBrandName);
        let brand = await tx.vehicleBrand.findFirst({
          where: { name: { equals: brandNameNorm, mode: 'insensitive' } }
        });
        if (!brand) {
          brand = await tx.vehicleBrand.create({
            data: { name: capitalizeText(customBrandName) }
          });
        }

        const modelNameNorm = normalizeText(customModelName);
        let model = await tx.vehicleModel.findFirst({
          where: {
            brandId: brand.id,
            name: { equals: modelNameNorm, mode: 'insensitive' }
          }
        });
        if (!model) {
          model = await tx.vehicleModel.create({
            data: {
              brandId: brand.id,
              name: capitalizeText(customModelName),
              segment: 'OTHER'
            }
          });
        }

        const versionNameNorm = normalizeText(customVersionName);
        let version = await tx.vehicleVersion.findFirst({
          where: {
            modelId: model.id,
            name: { equals: versionNameNorm, mode: 'insensitive' }
          }
        });
        if (!version) {
          version = await tx.vehicleVersion.create({
            data: {
              modelId: model.id,
              name: capitalizeText(customVersionName),
              fuel: 'GASOLINE',
              transmission: 'MANUAL'
            }
          });
        }

        resolvedVersionId = version.id;
      }

      if (!resolvedYearFabId && resolvedVersionId && customYearFab && customYearModel) {
        let year = await tx.vehicleYear.findFirst({
          where: {
            versionId: resolvedVersionId,
            yearFab: customYearFab,
            yearModel: customYearModel
          }
        });
        if (!year) {
          year = await tx.vehicleYear.create({
            data: {
              versionId: resolvedVersionId,
              yearFab: customYearFab,
              yearModel: customYearModel
            }
          });
        }

        resolvedYearFabId = year.id;
      }

      if (!resolvedVersionId || !resolvedYearFabId) {
        throw new BadRequestException('Erro ao resolver dados de catálogo do veículo.');
      }

      // Check for potential listing duplicity (RN10)
      const duplicate = await tx.listing.findFirst({
        where: {
          sellerProfileId: sellerId,
          vehicle: {
            versionId: resolvedVersionId,
            yearFabId: resolvedYearFabId,
          },
          status: { in: [ListingStatus.PENDING, ListingStatus.PUBLISHED] },
        },
        select: { id: true },
      });

      const isDuplicate = !!duplicate;
      const duplicateOfId = duplicate?.id || null;

      // 1. Create Vehicle
      const vehicle = await tx.vehicle.create({
        data: {
          ...vehicleData,
          versionId: resolvedVersionId,
          yearFabId: resolvedYearFabId,
          plate,
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
        seller: {
          select: {
            id: true,
            storeName: true,
            city: true,
            state: true,
            isVerified: true,
            userId: true,
          },
        },
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

  /**
   * Generic status update with validation (RN06).
   */
  async updateStatus(id: string, status: VehicleStatus, sellerId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { sellerId: true, status: true },
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.sellerId !== sellerId) throw new ForbiddenException('Ação não permitida');

    // RN06: SOLD is a terminal state (cannot go back to DRAFT/ACTIVE)
    if (vehicle.status === VehicleStatus.SOLD && status !== VehicleStatus.SOLD) {
      throw new BadRequestException('Não é possível alterar o status de um veículo vendido.');
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: { status },
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
   * Returns all active listings for buyers with advanced search and filters.
   */
  async findAllPublished(dto: SearchListingsDto) {
    const { q, brandId, modelId, yearFabId, city, state, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      status: VehicleStatus.ACTIVE,
      listings: {
        some: {
          status: ListingStatus.PUBLISHED,
        },
      },
    };

    // Filtros de Localização (No Veículo)
    if (city) whereClause.city = { contains: city, mode: 'insensitive' };
    if (state) whereClause.state = state;

    // Filtros de Categoria (Relacionamento Version -> Model -> Brand)
    if (yearFabId) whereClause.yearFabId = yearFabId;
    
    if (modelId || brandId) {
      whereClause.version = {
        model: {
          id: modelId || undefined,
          brandId: brandId || undefined,
        },
      };
    }

    // Filtro por Peça do Catálogo (Compatibilidade)
    if (dto.catalogPartId) {
      whereClause.compatibleParts = {
        some: {
          partCatalogId: dto.catalogPartId,
        },
      };
    }

    // Busca Full-Text (No Listing vinculado)
    if (q) {
      whereClause.listings = {
        some: {
          status: ListingStatus.PUBLISHED,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.vehicle.count({ where: whereClause }),
      this.prisma.vehicle.findMany({
        where: whereClause,
        include: {
          listings: {
            where: { status: ListingStatus.PUBLISHED },
          },
          photos: { orderBy: { order: 'asc' } },
          version: { 
            include: { 
              model: { include: { brand: true } } 
            } 
          },
          yearFab: true,
        } as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
   * RN14: Adding/changing photos forces status back to PENDING.
   */
  async confirmPhotos(id: string, sellerId: string, photos: { url: string; type: PhotoType; order: number }[]) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.sellerId !== sellerId) throw new ForbiddenException('Ação não permitida');

    // 1. Cancelar/remover jobs anteriores associados a este veículo na fila (Option A)
    try {
      const jobs = await this.vehiclePhotosQueue.getJobs(['waiting', 'active', 'delayed', 'paused']);
      for (const job of jobs) {
        if (job.data?.vehicleId === id) {
          this.logger.log(`Cancelando job anterior ${job.id} na fila para o veículo ${id}`);
          await job.remove();
        }
      }
    } catch (err) {
      this.logger.warn(`Falha não fatal ao remover jobs anteriores da fila: ${err.message}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 2. Limpar os registros antigos de fotos do banco para evitar sujeira
      await tx.vehiclePhoto.deleteMany({
        where: { vehicleId: id },
      });

      // 3. Manter/Reverter status para DRAFT (rascunho) temporariamente enquanto processa em background
      await tx.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.DRAFT },
      });

      await tx.listing.updateMany({
        where: { vehicleId: id },
        data: { 
          status: ListingStatus.DRAFT,
          publishedAt: null
        },
      });

      // 4. Enfileirar o novo lote de fotos para processamento assíncrono
      await this.vehiclePhotosQueue.add('process-vehicle-photo', {
        vehicleId: id,
        photos,
      });

      return { message: 'Fotos recebidas com sucesso. O processamento assíncrono e otimização das imagens foram iniciados em background.' };
    });
  }
}

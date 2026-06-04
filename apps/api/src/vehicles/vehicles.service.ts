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
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private catalogService: CatalogService,
    @InjectQueue('vehicle-photos') private vehiclePhotosQueue: Queue,
  ) {}

  /**
   * Creates a new vehicle and its corresponding listing in an atomic transaction.
   * RN14: Both entities are created with DRAFT status until photos are confirmed/processed.
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

    let isCustomCatalogCreated = false;

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
          isCustomCatalogCreated = true;
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
          isCustomCatalogCreated = true;
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
          isCustomCatalogCreated = true;
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
          isCustomCatalogCreated = true;
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

      // 1. Create Vehicle as DRAFT (BUG-V01)
      const vehicle = await tx.vehicle.create({
        data: {
          ...vehicleData,
          versionId: resolvedVersionId,
          yearFabId: resolvedYearFabId,
          plate,
          sellerId,
          availableParts,
          status: VehicleStatus.DRAFT,
        },
      });

      // 2. Create Main Listing (The vehicle itself) as DRAFT
      const mainListing = await tx.listing.create({
        data: {
          sellerProfileId: sellerId,
          vehicleId: vehicle.id,
          title,
          description,
          status: ListingStatus.DRAFT,
          isDuplicate,
          duplicateOfId,
        },
      });

      return { vehicle, listing: mainListing, warnings: isDuplicate ? ['Anúncio similar já existente.'] : [] };
    }).then(async (result) => {
      if (isCustomCatalogCreated) {
        await this.catalogService.invalidateCatalogCache();
      }
      return result;
    });
  }

  async findOne(id: string, userId?: string) {
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
      },
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');

    // RN14: Veículos em DRAFT ou PENDING não são visíveis publicamente
    // Apenas veículos com status ACTIVE são acessíveis no marketplace público.
    // O dono do veículo (vendedor) tem permissão de visualizar para fins de edição.
    if (vehicle.status === VehicleStatus.DRAFT || vehicle.status === VehicleStatus.PENDING) {
      let isOwner = false;
      const vehicleAny = vehicle as any;
      if (userId && vehicleAny.seller?.userId === userId) {
        isOwner = true;
      }
      if (!isOwner) {
        throw new NotFoundException('Veículo não disponível para visualização pública');
      }
    }

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

    // Remover propriedades undefined para evitar sobrescrever dados com NULL no Prisma (BUG-V03)
    const safeVehicleData = Object.entries(vehicleData).reduce((acc, [key, val]) => {
      if (val !== undefined) {
        acc[key] = val;
      }
      return acc;
    }, {} as any);

    return this.prisma.$transaction(async (tx) => {
      const updatedVehicle = await tx.vehicle.update({
        where: { id },
        data: { ...safeVehicleData, status: VehicleStatus.PENDING },
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
      const updatedVehicle = await tx.vehicle.update({
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

      return updatedVehicle; // ✅ Retorna o veículo atualizado (BUG-V06)
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
      const updatedVehicle = await tx.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.INACTIVE },
      });

      await tx.listing.updateMany({
        where: { vehicleId: id },
        data: { 
          status: ListingStatus.EXPIRED,
        },
      });

      return updatedVehicle; // ✅ Retorna o veículo atualizado (BUG-V06)
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

  async findBySeller(sellerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [total, vehicles] = await Promise.all([
      this.prisma.vehicle.count({ where: { sellerId } }),
      this.prisma.vehicle.findMany({
        where: { sellerId },
        include: { 
          listings: true, 
          photos: { take: 1, orderBy: { order: 'asc' } },
          version: {
            include: {
              model: {
                include: {
                  brand: true
                }
              }
            }
          },
          yearFab: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      })
    ]);

    const items = vehicles.map((v: any) => {
      if (!v.version?.model?.brand) {
        this.logger.warn(`Veículo ${v.id} sem versão/marca vinculada no catálogo.`);
      }

      return {
        id: v.id,
        title: v.listings?.[0]?.title || '',
        brand: v.version?.model?.brand?.name || 'Não informado',
        model: v.version?.model?.name || 'Não informado',
        version: v.version?.name || 'Não informado',
        yearFab: v.yearFab?.yearFab || 0,
        color: v.color,
        city: v.city,
        state: v.state,
        status: v.status,
        createdAt: v.createdAt,
        photos: v.photos || [],
        availableParts: v.availableParts || [],
      };
    });

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
   * Returns all active listings for buyers with advanced search and filters.
   */
  async findAllPublished(dto: SearchListingsDto) {
    const { q, brandId, modelId, yearFabId, city, state, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    const listingsFilter: any = { status: ListingStatus.PUBLISHED };

    if (q) {
      listingsFilter.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const whereClause: any = {
      status: VehicleStatus.ACTIVE,
      listings: {
        some: listingsFilter,
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
        },
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

    if (count < 1 || count > 20) {
      throw new BadRequestException('A quantidade de fotos deve ser um número inteiro entre 1 e 20.');
    }

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

    // Validar quantidade máxima de fotos (FLUXO-02)
    if (photos.length > 20) {
      throw new BadRequestException('Não é permitido exceder o limite de 20 fotos por veículo.');
    }

    // 1. Cancelar/remover jobs anteriores associados a este veículo na fila em O(1) (BUG-V12)
    try {
      await this.vehiclePhotosQueue.remove(`vehicle-photos-${id}`).catch(() => null);
    } catch (err) {
      this.logger.warn(`Falha não fatal ao remover jobs anteriores da fila: ${err.message}`);
    }

    // 2. Transação do Prisma para atualizar fotos provisórias e reverter para DRAFT (BUG-V02)
    await this.prisma.$transaction(async (tx) => {
      // Limpar os registros antigos de fotos do banco para evitar sujeira
      await tx.vehiclePhoto.deleteMany({
        where: { vehicleId: id },
      });

      // Salvar registros provisórios com as URLs brutas enviadas pelo frontend
      await tx.vehiclePhoto.createMany({
        data: photos.map((p) => ({
          vehicleId: id,
          url: p.url,
          type: p.type,
          order: p.order,
        })),
      });

      // Reverter status do veículo e listing para DRAFT temporariamente enquanto processa
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
    });

    // 3. Enfileirar o novo lote de fotos fora da transação do Prisma
    try {
      await this.vehiclePhotosQueue.add(
        'process-vehicle-photo',
        {
          vehicleId: id,
          photos,
        },
        { jobId: `vehicle-photos-${id}` } // ID determinístico para cancelamento O(1)
      );
    } catch (queueError) {
      this.logger.error(`Falha ao enfileirar job de fotos para veículo ${id}: ${queueError.message}`);
      throw new BadRequestException('Falha ao agendar o processamento das fotos. Tente novamente.');
    }

    return { message: 'Fotos recebidas com sucesso. O processamento assíncrono e otimização das imagens foram iniciados em background.' };
  }

  /**
   * Reactivates a removed/inactive vehicle (RN14: goes back to PENDING).
   */
  async reactivate(id: string, sellerId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { sellerId: true, status: true, versionId: true, yearFabId: true },
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.sellerId !== sellerId) throw new ForbiddenException('Ação não permitida');

    if (vehicle.status === VehicleStatus.SOLD) {
      throw new BadRequestException('Não é possível reativar um veículo vendido.');
    }

    // ✅ Re-checar RN10 antes de reativar (BUG-V10)
    const duplicate = await this.prisma.listing.findFirst({
      where: {
        sellerProfileId: sellerId,
        vehicle: {
          versionId: vehicle.versionId,
          yearFabId: vehicle.yearFabId,
        },
        status: { in: [ListingStatus.PENDING, ListingStatus.PUBLISHED] },
        NOT: { vehicleId: id },
      },
    });

    if (duplicate) {
      throw new ConflictException('Você já possui um anúncio ativo para este veículo.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedVehicle = await tx.vehicle.update({
        where: { id },
        data: { status: VehicleStatus.PENDING },
      });

      await tx.listing.updateMany({
        where: { vehicleId: id },
        data: { 
          status: ListingStatus.PENDING,
          publishedAt: null
        },
      });

      return { vehicle: updatedVehicle, message: 'Sucata reativada com sucesso. Enviada para moderação.' };
    });
  }

  /**
   * Deletes a vehicle and its related listings from the database.
   */
  async remove(id: string, sellerId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (vehicle.sellerId !== sellerId) throw new ForbiddenException('Ação não permitida');

    return this.prisma.$transaction(async (tx) => {
      // First delete associated listings to satisfy foreign key constraints
      await tx.listing.deleteMany({
        where: { vehicleId: id },
      });

      // Then delete the vehicle
      const deletedVehicle = await tx.vehicle.delete({
        where: { id },
      });

      return { vehicle: deletedVehicle, message: 'Sucata excluída com sucesso.' };
    });
  }
}

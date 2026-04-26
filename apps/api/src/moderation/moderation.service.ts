import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ModerationFiltersDto } from './dto/moderation-filters.dto';
import { ApproveListingDto } from './dto/approve-listing.dto';
import { RejectListingDto } from './dto/reject-listing.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { Action } from '../auth/casl/action.enum';
import { subject } from '@casl/ability';
import { CaslAbilityFactory } from '../auth/casl/casl-ability.factory';
import { StorageService } from '../common/storage/storage.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    @InjectQueue('alerts') private readonly alertsQueue: Queue,
    private readonly storageService: StorageService,
  ) {}

  private maskLicensePlate(plate?: string): string {
    if (!plate) return '';
    const visible = plate.substring(0, 3);
    return `${visible}-****`;
  }

  async findAllPendingListings(filters: ModerationFiltersDto) {
    const { sellerId, status, startDate, endDate, cursor, limit = 10 } = filters;

    const where: any = {
      status: status || 'PENDING',
    };

    if (sellerId) {
      where.sellerProfileId = sellerId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const listings = await this.prisma.listing.findMany({
      where,
      include: {
        vehicle: {
          include: {
            photos: { orderBy: { order: 'asc' } },
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
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                listings: { where: { status: 'PUBLISHED' } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // FIFO
      take: limit + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
    });

    const hasMore = listings.length > limit;
    const items = hasMore ? listings.slice(0, limit) : listings;

    const nextCursor = items.length > 0 ? items[items.length - 1].id : null;

    // Mask license plates
    const mappedItems = items.map((listing) => {
      const maskedListing = { ...listing };
      if (maskedListing.vehicle) {
        maskedListing.vehicle.licensePlate = this.maskLicensePlate(maskedListing.vehicle.licensePlate);
      }
      return maskedListing;
    });

    return {
      items: mappedItems,
      hasMore,
      nextCursor,
    };
  }

  async findOneListing(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            photos: { orderBy: { order: 'asc' } },
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
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Anúncio com ID ${id} não encontrado.`);
    }

    // Mask license plate
    if (listing.vehicle) {
      listing.vehicle.licensePlate = this.maskLicensePlate(listing.vehicle.licensePlate);
    }

    return listing;
  }

  async approveListing(id: string, dto: ApproveListingDto, user: any) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        sellerProfile: true,
      },
    });

    if (!listing) {
      throw new NotFoundException(`Anúncio com ID ${id} não encontrado.`);
    }

    // Evaluate CASL permissions against this instance
    const ability = this.caslAbilityFactory.createForUser({
      id: user.id || user.sub,
      email: user.email,
      type: user.type,
    });

    if (ability.cannot(Action.Approve, subject('Listing', listing))) {
      throw new ForbiddenException('Você não tem permissão para aprovar este anúncio (Conflito de Interesse).');
    }

    // Option A: Execute side effects in transaction to guarantee rollback on failure
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Update listing status and publishedAt
        await tx.listing.update({
          where: { id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });

        // 2. Create AuditLog
        await tx.auditLog.create({
          data: {
            action: 'APPROVE',
            entity: 'Listing',
            entityId: id,
            actorId: user.id || user.sub,
            details: { note: dto.moderatorNote || 'Aprovado via painel de moderação' },
          },
        });

        // 3. Side effect: Add to match-alerts BullMQ queue
        try {
          await this.alertsQueue.add(
            'match-alerts',
            { listingId: id },
            { removeOnComplete: true },
          );
        } catch (error) {
          console.error('Falha ao adicionar job match-alerts:', error);
          throw new Error(`Falha no enfileiramento de alertas: ${error.message}`);
        }

        // 4. Side effect: Notification (M11 placeholder)
        console.log(`[M11] Notificação enviada para o vendedor ${listing.sellerProfile.userId}: Seu anúncio foi publicado.`);
      });
    } catch (error) {
      throw new BadRequestException(`Falha ao aprovar anúncio: ${error.message}`);
    }

    return { message: 'Anúncio aprovado com sucesso!' };
  }

  async rejectListing(id: string, dto: RejectListingDto, user: any) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        sellerProfile: true,
      },
    });

    if (!listing) {
      throw new NotFoundException(`Anúncio com ID ${id} não encontrado.`);
    }

    // Evaluate CASL permissions against this instance
    const ability = this.caslAbilityFactory.createForUser({
      id: user.id || user.sub,
      email: user.email,
      type: user.type,
    });

    if (ability.cannot(Action.Reject, subject('Listing', listing))) {
      throw new ForbiddenException('Você não tem permissão para rejeitar este anúncio (Conflito de Interesse).');
    }

    // Option A: Execute side effects in transaction to guarantee rollback on failure
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Update listing status
        await tx.listing.update({
          where: { id },
          data: {
            status: 'REJECTED',
          },
        });

        // 2. Create AuditLog
        await tx.auditLog.create({
          data: {
            action: 'REJECT',
            entity: 'Listing',
            entityId: id,
            actorId: user.id || user.sub,
            details: { reason: dto.rejectionReason },
          },
        });

        // 3. Side effect: Notification (M11 placeholder)
        console.log(`[M11] Notificação enviada para o vendedor ${listing.sellerProfile.userId}: Seu anúncio foi rejeitado. Motivo: ${dto.rejectionReason}`);
      });
    } catch (error) {
      throw new BadRequestException(`Falha ao rejeitar anúncio: ${error.message}`);
    }

    return { message: 'Anúncio rejeitado com sucesso.' };
  }

  async findAllPendingVerifications() {
    const verifications = await this.prisma.sellerVerification.findMany({
      where: { status: 'PENDING' },
      include: {
        sellerProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      verifications.map(async (v) => {
        let documentPaths: string[] = [];
        try {
          if (typeof v.documentUrls === 'string') {
            documentPaths = JSON.parse(v.documentUrls);
          } else if (Array.isArray(v.documentUrls)) {
            documentPaths = v.documentUrls as string[];
          }
        } catch (e) {
          documentPaths = [];
        }

        const signedUrls = await Promise.all(
          documentPaths.map(async (path) => {
            try {
              return await this.storageService.getSignedUrl('verifications', path);
            } catch (err) {
              return null;
            }
          }),
        );

        return {
          ...v,
          signedUrls: signedUrls.filter(Boolean),
        };
      }),
    );
  }

  async approveVerification(id: string, user: any) {
    const verification = await this.prisma.sellerVerification.findUnique({
      where: { id },
      include: { sellerProfile: true },
    });

    if (!verification) {
      throw new NotFoundException('Solicitação de verificação não encontrada.');
    }

    if (verification.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitação já foi processada.');
    }

    if (verification.sellerProfile.userId === (user.id || user.sub)) {
      throw new ForbiddenException('Você não pode moderar sua própria solicitação de verificação.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.sellerVerification.update({
          where: { id },
          data: {
            status: 'APPROVED',
            moderatorId: user.id || user.sub,
            resolvedAt: new Date(),
          },
        });

        await tx.sellerProfile.update({
          where: { id: verification.sellerProfileId },
          data: { isVerified: true },
        });

        try {
          await this.alertsQueue.add('send-notification', {
            userId: verification.sellerProfile.userId,
            type: 'SELLER_VERIFIED',
            title: 'Perfil Verificado!',
            message: 'Parabéns! Seus documentos foram aprovados e você recebeu o Selo Verificado.',
          });
        } catch (error) {
          throw new Error('Falha no enfileiramento de notificações.');
        }

        return updated;
      });
    } catch (error) {
      throw new BadRequestException(`Falha ao aprovar verificação: ${error.message}`);
    }
  }

  async rejectVerification(id: string, dto: RejectVerificationDto, user: any) {
    const verification = await this.prisma.sellerVerification.findUnique({
      where: { id },
      include: { sellerProfile: true },
    });

    if (!verification) {
      throw new NotFoundException('Solicitação de verificação não encontrada.');
    }

    if (verification.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitação já foi processada.');
    }

    if (verification.sellerProfile.userId === (user.id || user.sub)) {
      throw new ForbiddenException('Você não pode moderar sua própria solicitação de verificação.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.sellerVerification.update({
          where: { id },
          data: {
            status: 'REJECTED',
            notes: dto.reason,
            moderatorId: user.id || user.sub,
            resolvedAt: new Date(),
          },
        });

        try {
          await this.alertsQueue.add('send-notification', {
            userId: verification.sellerProfile.userId,
            type: 'SELLER_VERIFICATION_REJECTED',
            title: 'Documentos Rejeitados',
            message: `Sua verificação de perfil foi rejeitada pelo seguinte motivo: ${dto.reason}`,
          });
        } catch (error) {
          throw new Error('Falha no enfileiramento de notificações.');
        }

        return updated;
      });
    } catch (error) {
      throw new BadRequestException(`Falha ao rejeitar verificação: ${error.message}`);
    }
  }
}

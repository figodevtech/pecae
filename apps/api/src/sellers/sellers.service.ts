import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { CreateSellerProfileDto } from './dto/create-seller-profile.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SellersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @InjectQueue('seller-stats') private readonly statsQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateSellerProfileDto) {
    const existing = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('User already has a seller profile');
    }

    // Using transaction to create profile and stats together
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.sellerProfile.create({
        data: {
          ...dto,
          userId,
          openHours: dto.openHours !== undefined ? dto.openHours : undefined, // Prisma requires undefined for JSON if not provided
        },
      });

      await tx.sellerStats.create({
        data: {
          sellerProfileId: profile.id,
        },
      });

      return profile;
    });
  }

  async update(userId: string, dto: UpdateSellerProfileDto) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    return this.prisma.sellerProfile.update({
      where: { userId },
      data: {
        ...dto,
        openHours: dto.openHours !== undefined ? dto.openHours : undefined,
      },
    });
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        stats: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    return profile;
  }

  async findPublicProfile(id: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { id },
      include: {
        stats: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!profile || profile.user.status === 'SUSPENDED' || profile.user.status === 'BANNED') {
      throw new NotFoundException('Seller profile not found or unavailable');
    }

    // Omit sensitive data
    // We only expose city/state, not the full address or exact coordinates
    const { userId, cnpj, address, lat, lng, whatsapp, phone, user, ...publicData } = profile;
    
    // Mask CNPJ: XX.XXX.XXX/0001-XX
    const maskedCnpj = cnpj ? `${cnpj.slice(0, 2)}.***.***/${cnpj.slice(8, 12)}-**` : undefined;

    return {
      ...publicData,
      cnpj: maskedCnpj,
      whatsapp: profile.showContactInfo ? whatsapp : undefined,
      phone: profile.showContactInfo ? phone : undefined,
      stats: profile.stats ? {
        activeListings: profile.stats.activeListings,
        avgResponseTimeMinutes: profile.stats.avgResponseTimeMinutes,
        rating: profile.stats.rating,
        totalReviews: profile.stats.totalReviews,
      } : undefined,

    };
  }

  async getStats(userId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        stats: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    return profile.stats;
  }

  async getSellerListings(sellerProfileId: string, query?: { page?: string | number; limit?: string | number }) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
      include: {
        user: { select: { status: true } }
      }
    });

    if (!profile || profile.deletedAt || profile.user.status === 'SUSPENDED' || profile.user.status === 'BANNED') {
      throw new NotFoundException('Seller profile not found or unavailable');
    }

    const page = query?.page ? Math.max(1, parseInt(String(query.page), 10)) : undefined;
    const limit = query?.limit ? Math.max(1, parseInt(String(query.limit), 10)) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    // Note: Assuming `Listing` model is now available in schema
    return this.prisma.listing.findMany({
      where: {
        sellerProfileId,
        status: 'PUBLISHED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
    });
  }

  async requestStatsUpdate(sellerProfileId: string) {
    await this.statsQueue.add('update-seller-stats', { sellerProfileId });
  }

  async generateLogoUploadUrl(userId: string, filename: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    const extension = filename.split('.').pop();
    const path = `sellers/${userId}/logo-${Date.now()}.${extension}`;
    
    const data = await this.storageService.createSignedUploadUrl('seller-logos', path);

    return {
      uploadUrl: data.uploadUrl,
      token: data.token,
      path: data.path,
      publicUrl: data.publicUrl,
    };
  }

  async confirmLogoUpload(userId: string, publicUrl: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    return this.prisma.sellerProfile.update({
      where: { userId },
      data: { logo: publicUrl },
    });
  }

  async requestVerification(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.sellerProfile.findUnique({
        where: { userId },
        include: { verifications: { where: { status: 'PENDING' } } },
      });

      if (!profile) {
        throw new NotFoundException('Seller profile not found');
      }

      if (profile.verifications.length > 0) {
        throw new ConflictException('A verification request is already pending');
      }

      if (profile.isVerified) {
        throw new ConflictException('Seller is already verified');
      }

      // Criamos a solicitação com status PENDING imediatamente para evitar race condition
      await tx.sellerVerification.create({
        data: {
          sellerProfileId: profile.id,
          documentUrls: [],
          status: 'PENDING',
        },
      });

      // Geramos 5 slots de upload para o processo de verificação
      const signedUrls = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => {
          const path = `verifications/${profile.id}/doc_${Date.now()}_${i}`;
          const data = await this.storageService.createSignedUploadUrl('verification-docs', path);
          return {
            id: `doc_${i}`,
            ...data,
          };
        }),
      );

      return signedUrls;
    });
  }

  async confirmVerificationRequest(userId: string, documentUrls: string[]) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        verifications: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    const pendingVerification = profile.verifications[0];
    if (!pendingVerification) {
      throw new BadRequestException('No pending verification request found. Start verification first.');
    }

    return this.prisma.sellerVerification.update({
      where: { id: pendingVerification.id },
      data: {
        documentUrls,
      },
    });
  }

  async getVerificationStatus(userId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        verifications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    return {
      isVerified: profile.isVerified,
      latestVerification: profile.verifications[0] || null,
    };
  }
}

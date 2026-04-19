import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestVerificationDto } from './dto/request-verification.dto';
import { ResolveVerificationDto } from './dto/resolve-verification.dto';
import { VerificationStatus } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class VerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
  ) {}

  async getPendingVerifications() {
    return this.prisma.sellerVerification.findMany({
      where: {
        status: VerificationStatus.PENDING,
      },
      include: {
        sellerProfile: {
          select: {
            id: true,
            storeName: true,
            type: true,
            cnpj: true,
            createdAt: true,
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
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async requestVerification(userId: string, dto: RequestVerificationDto) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    const pendingVerification = await this.prisma.sellerVerification.findFirst({
      where: {
        sellerProfileId: profile.id,
        status: VerificationStatus.PENDING,
      },
    });

    if (pendingVerification) {
      throw new ConflictException('A verification request is already pending');
    }

    return this.prisma.sellerVerification.create({
      data: {
        sellerProfileId: profile.id,
        documentUrls: JSON.stringify(dto.documentUrls),
        status: VerificationStatus.PENDING,
      },
    });
  }

  async resolveVerification(verificationId: string, moderatorId: string, dto: ResolveVerificationDto) {
    const verification = await this.prisma.sellerVerification.findUnique({
      where: { id: verificationId },
      include: {
        sellerProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!verification) {
      throw new NotFoundException('Verification request not found');
    }

    if (verification.status !== VerificationStatus.PENDING) {
      throw new ConflictException('Verification is already resolved');
    }

    const resolvedVerification = await this.prisma.$transaction(async (tx) => {
      const resolved = await tx.sellerVerification.update({
        where: { id: verificationId },
        data: {
          status: dto.status,
          notes: dto.notes,
          moderatorId,
          resolvedAt: new Date(),
        },
      });

      if (dto.status === VerificationStatus.APPROVED) {
        await tx.sellerProfile.update({
          where: { id: verification.sellerProfileId },
          data: { isVerified: true },
        });
      }

      return resolved;
    });

    // Disparar email via BullMQ de forma assíncrona
    await this.mailQueue.add('verification-status', {
      email: verification.sellerProfile.user.email,
      storeName: verification.sellerProfile.storeName,
      status: dto.status,
      notes: dto.notes,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    return resolvedVerification;
  }
}

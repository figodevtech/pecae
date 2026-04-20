import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBuyerDto } from './dto/update-buyer.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import * as bcrypt from 'bcrypt';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BuyersService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('user-management') private userQueue: Queue,
  ) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      avatar: user.avatar,
      buyerProfile: user.buyerProfile,
      notificationPreferences: user.notificationPreferences,
    };
  }

  async updateMyProfile(userId: string, updateBuyerDto: UpdateBuyerDto) {
    const { name, avatar, notificationPreferences } = updateBuyerDto;
    
    await this.prisma.$transaction(async (tx) => {
      if (name || avatar !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(name && { name }),
            ...(avatar !== undefined && { avatar }),
          },
        });

        await tx.buyerProfile.update({
          where: { userId },
          data: {
            ...(name && { name }),
            ...(avatar !== undefined && { avatar }),
          },
        });
      }

      if (notificationPreferences) {
        await tx.notificationPreferences.update({
          where: { userId },
          data: {
            ...(notificationPreferences.push !== undefined && { pushEnabled: notificationPreferences.push }),
            ...(notificationPreferences.email !== undefined && { emailEnabled: notificationPreferences.email }),
            ...(notificationPreferences.inApp !== undefined && { inAppEnabled: notificationPreferences.inApp }),
          },
        });
      }
    });

    return this.getMyProfile(userId);
  }

  async deleteAccount(userId: string, deleteAccountDto: DeleteAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.status === 'DELETED') {
      throw new UnauthorizedException('A conta já foi excluída.');
    }

    if (user.passwordHash) {
      const isPasswordValid = await bcrypt.compare(
        deleteAccountDto.currentPassword,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Senha atual incorreta.');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Soft delete: status DELETED
      await tx.user.update({
        where: { id: userId },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
          originalEmail: user.email,
        },
      });

      // Revoke all refresh tokens
      await tx.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      });
    });

    // Schedule anonymization job in 30 days
    await this.userQueue.add(
      'anonymize-user',
      { userId },
      { delay: 30 * 24 * 60 * 60 * 1000 },
    );

    return { message: 'Conta agendada para exclusão com sucesso.' };
  }
}

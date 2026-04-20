import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('user-management')
export class AnonymizeUserProcessor extends WorkerHost {
  private readonly logger = new Logger(AnonymizeUserProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ userId: string }, any, string>): Promise<any> {
    const { userId } = job.data;
    this.logger.log(`Iniciando processo de anonimização para o usuário ${userId}...`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { buyerProfile: true, sellerProfile: true },
    });

    if (!user) {
      this.logger.warn(`Usuário ${userId} não encontrado, abortando anonimização.`);
      return;
    }

    if (user.status !== 'DELETED') {
      this.logger.warn(`Usuário ${userId} não tem status DELETED (status: ${user.status}), abortando anonimização.`);
      return;
    }

    const anonEmail = `anon-${userId}@deleted.pecae.com`;
    const anonName = `Usuário Deletado ${userId.substring(0, 8)}`;

    await this.prisma.$transaction(async (tx) => {
      // 1. Atualizar base User
      await tx.user.update({
        where: { id: userId },
        data: {
          name: anonName,
          email: anonEmail,
          passwordHash: null,
          phone: null,
          googleId: null,
          appleId: null,
          avatar: null,
        },
      });

      // 2. Atualizar BuyerProfile
      if (user.buyerProfile) {
        await tx.buyerProfile.update({
          where: { userId },
          data: {
            name: anonName,
            avatar: null,
          },
        });
      }

      // 3. Atualizar SellerProfile (se for o caso)
      if (user.sellerProfile) {
        await tx.sellerProfile.update({
          where: { userId },
          data: {
            // cnpj e companyName poderiam ser anonimizados aqui caso fosse aplicável
            storeName: `Empresa Deletada ${userId.substring(0, 8)}`,
            logo: null,
            phone: null,
            whatsapp: "00000000000",
            address: "Removido por LGPD",
            city: "Removido",
            state: "XX",
            zipCode: "00000-000",
          },
        });
      }

      this.logger.log(`Usuário ${userId} anonimizado com sucesso.`);
    });
  }
}

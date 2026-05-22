import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { Inject, Logger } from '@nestjs/common';
import { IPushProvider } from './providers/push-provider.interface';

@Processor('notifications-queue')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @Inject(IPushProvider) private readonly pushProvider: IPushProvider,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, type, title, body, notificationId } = job.data;

    switch (job.name) {
      case 'send-push': {
        try {
          // 1. Obter pushTokens da tabela dedicada
          const userTokens = await this.prisma.pushToken.findMany({
            where: { userId },
          });

          if (!userTokens || userTokens.length === 0) {
            if (notificationId) {
              await this.prisma.notificationLog.create({
                data: {
                  notificationId,
                  channel: 'PUSH',
                  status: 'SKIPPED',
                  error: 'Token push do dispositivo não encontrado.',
                },
              });
            }
            return;
          }

          // 2. Disparar via Provedor Desacoplado para cada token
          for (const pushToken of userTokens) {
            await this.pushProvider.sendPush(pushToken.token, title, body, job.data.data);
          }

          if (notificationId) {
            await this.prisma.notificationLog.create({
              data: {
                notificationId,
                channel: 'PUSH',
                status: 'SENT',
              },
            });
          }
        } catch (error: any) {
          if (notificationId) {
            await this.prisma.notificationLog.create({
              data: {
                notificationId,
                channel: 'PUSH',
                status: 'FAILED',
                error: error.message || 'Erro desconhecido ao disparar push.',
              },
            });
          }
          throw error;
        }
        break;
      }

      case 'send-email': {
        try {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
          });

          if (!user || !user.email) {
            if (notificationId) {
              await this.prisma.notificationLog.create({
                data: {
                  notificationId,
                  channel: 'EMAIL',
                  status: 'SKIPPED',
                  error: 'E-mail do usuário inexistente.',
                },
              });
            }
            return;
          }

          // Tratar ambiente de sandbox / fallback caso domínio não validado
          const isProd = this.configService.get('NODE_ENV') === 'production';
          const domainVerified = this.configService.get('RESEND_DOMAIN_VERIFIED') === 'true';

          if (!isProd || !domainVerified) {
            this.logger.debug(`[SANDBOX/TESTE] Mocking E-mail para: ${user.email} - Assunto: ${title}`);
          } else {
            // Disparar via serviço de e-mail existente
            await this.mailService.sendVerificationStatusEmail(
              user.email,
              user.name || 'Usuário',
              'APPROVED',
              body,
            );
          }

          if (notificationId) {
            await this.prisma.notificationLog.create({
              data: {
                notificationId,
                channel: 'EMAIL',
                status: 'SENT',
              },
            });
          }
        } catch (error: any) {
          if (notificationId) {
            await this.prisma.notificationLog.create({
              data: {
                notificationId,
                channel: 'EMAIL',
                status: 'FAILED',
                error: error.message || 'Erro desconhecido ao disparar e-mail.',
              },
            });
          }
          throw error;
        }
        break;
      }

      default:
        this.logger.warn(`Job desconhecido: ${job.name}`);
    }
  }
}

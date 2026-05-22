import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { MatchProcessor } from './match.processor';
import { DigestProcessor } from './digest.processor';
import { MailModule } from '../mail/mail.module';
import { NotificationController } from './notification.controller';
import { IPushProvider } from './providers/push-provider.interface';
import { ExpoPushProvider } from './providers/expo-push.provider';

@Global()
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'notifications-queue' },
      { name: 'alerts' }
    ),
    MailModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService, 
    NotificationProcessor, 
    MatchProcessor, 
    DigestProcessor,
    {
      provide: IPushProvider,
      useClass: ExpoPushProvider,
    }
  ],
  exports: [NotificationService, BullModule, IPushProvider],
})
export class NotificationModule {}

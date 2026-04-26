import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { MailModule } from '../mail/mail.module';
import { NotificationController } from './notification.controller';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications-queue',
    }),
    MailModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService, BullModule],
})
export class NotificationModule {}

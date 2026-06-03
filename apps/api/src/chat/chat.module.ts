import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { JwtModule } from '@nestjs/jwt';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [JwtModule, NotificationModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

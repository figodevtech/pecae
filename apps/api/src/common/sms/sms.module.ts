import { Module, Global } from '@nestjs/common';
import { SmsService, MockSmsService } from './sms.service';

@Global()
@Module({
  providers: [
    {
      provide: SmsService,
      useClass: MockSmsService, // Por padrão usa o Mock, configurável via env no futuro
    },
  ],
  exports: [SmsService],
})
export class SmsModule {}

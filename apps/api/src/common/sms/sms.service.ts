import { Injectable, Logger } from '@nestjs/common';

export abstract class SmsService {
  abstract sendSms(phone: string, message: string): Promise<void>;
}

@Injectable()
export class MockSmsService implements SmsService {
  private readonly logger = new Logger(MockSmsService.name);

  async sendSms(phone: string, message: string): Promise<void> {
    this.logger.log(`[MOCK SMS] Enviando para ${phone}: ${message}`);
    // Simula latência de rede
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

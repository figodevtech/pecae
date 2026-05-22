import { Injectable, Logger } from '@nestjs/common';
import { IPushProvider } from './push-provider.interface';

@Injectable()
export class ExpoPushProvider implements IPushProvider {
  private readonly logger = new Logger(ExpoPushProvider.name);

  async sendPush(token: string, title: string, body: string, data?: any): Promise<void> {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          sound: 'default',
          title,
          body,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Expo API error: ${response.status} ${response.statusText}`);
      }
      
      this.logger.debug(`Push enviado via Expo para o token ${token}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar push via Expo para ${token}:`, error);
      throw error;
    }
  }
}

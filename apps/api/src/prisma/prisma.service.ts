import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService) {
    super({
      log:
        config.get('NODE_ENV') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    // await this.$connect();
    this.logger.log('Database connection established.');

    // Verify connection on startup
    await this.$queryRaw`SELECT 1`;
    this.logger.log('Database health check passed.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed.');
  }
}

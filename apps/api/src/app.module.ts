import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { SellersModule } from './sellers/sellers.module';
import { BuyersModule } from './buyers/buyers.module';
import { VerificationsModule } from './verifications/verifications.module';
import { StorageModule } from './common/storage/storage.module';
import { CatalogModule } from './catalog/catalog.module';
import { RedisModule } from './common/redis/redis.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SearchModule } from './search/search.module';
import { ListingsModule } from './listings/listings.module';
import { ChatModule } from './chat/chat.module';
import { ModerationModule } from './moderation/moderation.module';
import { NotificationModule } from './notifications/notification.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdsModule } from './ads/ads.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { SmsModule } from './common/sms/sms.module';
import { ReportsModule } from './reports/reports.module';
import { SavedSearchesModule } from './saved-searches/saved-searches.module';
import { BillingModule } from './billing/billing.module';




@Module({
  imports: [
    // --- Config: Load .env globally ---
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // --- BullMQ: Redis connection ---
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    // --- Rate limiting: global throttler ---
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
    ]),

    // --- Database: Global Prisma client ---
    PrismaModule,

    // --- Feature Modules ---
    AuthModule,
    UsersModule,
    MailModule,
    SellersModule,
    BuyersModule,
    VerificationsModule,
    StorageModule,
    CatalogModule,
    RedisModule,
    VehiclesModule,
    ReviewsModule,
    SearchModule,
    ListingsModule,
    ChatModule,
    ModerationModule,
    NotificationModule,
    AnalyticsModule,
    AdsModule,
    SmsModule,
    ReportsModule,
    SavedSearchesModule,
    BillingModule,
  ],
  providers: [
    // Register ThrottlerGuard globally so @Throttle() decorators are enforced
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT Auth Guard: All routes are private by default
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

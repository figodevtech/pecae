import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { StripeProvider } from './providers/stripe.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    {
      provide: PaymentProvider,
      useClass: StripeProvider,
    },
  ],
  exports: [BillingService],
})
export class BillingModule {}

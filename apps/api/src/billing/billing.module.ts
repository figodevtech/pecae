import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { StripeProvider } from './providers/stripe.provider';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
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

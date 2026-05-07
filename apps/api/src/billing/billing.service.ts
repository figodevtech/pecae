import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { PlanType, AdCampaignStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private paymentProvider: PaymentProvider,
  ) {}

  /**
   * Obtém ou cria um cliente no provedor de pagamento.
   */
  async getOrCreateCustomer(sellerId: string) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      include: { user: true },
    });

    if (!seller) throw new NotFoundException('Vendedor não encontrado');
    if (seller.stripeCustomerId) return seller.stripeCustomerId;

    const customerId = await this.paymentProvider.createCustomer(
      seller.user.email,
      seller.storeName,
    );

    await this.prisma.sellerProfile.update({
      where: { id: sellerId },
      data: { stripeCustomerId: customerId },
    });

    return customerId;
  }

  /**
   * Cria uma intenção de pagamento para destacar um anúncio (Featured Ad).
   */
  async createFeaturedAdIntent(listingId: string, sellerId: string, days: number) {
    if (days <= 0) throw new BadRequestException('Duração inválida');

    const amount = days * 500; // R$ 5,00 por dia (em centavos)
    const customerId = await this.getOrCreateCustomer(sellerId);

    const intent = await this.paymentProvider.createPaymentIntent({
      amount,
      currency: 'brl',
      customerId,
      metadata: { 
        listingId, 
        type: 'featured_ad', 
        days: days.toString() 
      },
    });

    // Cria a campanha como PENDING_PAYMENT
    await this.prisma.adCampaign.create({
      data: {
        listingId,
        status: AdCampaignStatus.PENDING_PAYMENT,
        budget: amount / 100,
        spent: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        externalPaymentId: intent.id,
      },
    });

    return intent;
  }

  /**
   * Assina um plano premium.
   */
  async subscribeToPlan(sellerId: string, plan: PlanType) {
    if (plan === PlanType.FREE) {
      throw new BadRequestException('Não é possível assinar o plano gratuito.');
    }

    const customerId = await this.getOrCreateCustomer(sellerId);
    
    // Mapeamento de preços (ID do Stripe vindo da config ou DB)
    const priceId = plan === PlanType.PREMIUM ? 'price_premium_id' : 'price_pro_id';

    const subscription = await this.paymentProvider.createSubscription({
      customerId,
      priceId,
      metadata: { sellerId, plan },
    });

    return subscription;
  }

  /**
   * Processa o webhook de pagamento bem-sucedido.
   */
  async handlePaymentSuccess(externalPaymentId: string) {
    const campaign = await this.prisma.adCampaign.findFirst({
      where: { externalPaymentId },
    });

    if (campaign) {
      await this.prisma.adCampaign.update({
        where: { id: campaign.id },
        data: { status: AdCampaignStatus.ACTIVE },
      });

      await this.prisma.listing.update({
        where: { id: campaign.listingId },
        data: { isSponsoredActive: true },
      });
    }
  }
}

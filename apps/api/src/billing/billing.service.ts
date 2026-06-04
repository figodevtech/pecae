import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { PlanType, AdCampaignStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private paymentProvider: PaymentProvider,
    private config: ConfigService,
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

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
    });

    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    if (listing.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Não é possível destacar um anúncio com status ${listing.status}. Apenas anúncios publicados podem ser destacados.`,
      );
    }

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
    
    // Mapeamento de preços (ID do Stripe vindo da config ou DB) (BUG #8)
    const priceId = plan === PlanType.PREMIUM 
      ? this.config.get<string>('STRIPE_PRICE_PREMIUM_ID')
      : this.config.get<string>('STRIPE_PRICE_PRO_ID');

    if (!priceId) {
      throw new InternalServerErrorException('Configuração de plano inválida ou ID do preço Stripe ausente.');
    }

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

  /**
   * Processa webhook do Stripe para atualização ou ativação de assinatura (BUG #9).
   */
  async handleSubscriptionSuccess(stripeCustomerId: string, plan: PlanType, expiresAt: Date) {
    const seller = await this.prisma.sellerProfile.findFirst({
      where: { stripeCustomerId },
    });

    if (!seller) {
      throw new NotFoundException('Vendedor não encontrado para o Stripe Customer ID');
    }

    await this.prisma.sellerProfile.update({
      where: { id: seller.id },
      data: {
        plan,
        planExpiresAt: expiresAt,
      },
    });
  }

  /**
   * Processa eventos do webhook do Stripe centralizadamente.
   */
  async processStripeWebhookEvent(event: any) {
    const { type, data } = event;

    switch (type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = data.object;
        await this.handlePaymentSuccess(paymentIntent.id);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = data.object;
        const stripeCustomerId = subscription.customer;
        const status = subscription.status;

        if (status === 'active' || status === 'trialing') {
          const priceId = subscription.items?.data?.[0]?.price?.id;
          if (!priceId) {
            throw new BadRequestException('ID do preço não encontrado na assinatura do Stripe');
          }
          const plan = this.getPlanFromPriceId(priceId);
          if (!plan) {
            throw new BadRequestException(`Preço Stripe não reconhecido: ${priceId}`);
          }
          const expiresAt = new Date(subscription.current_period_end * 1000);
          await this.handleSubscriptionSuccess(stripeCustomerId, plan, expiresAt);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = data.object;
        const stripeCustomerId = invoice.customer;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const priceId = invoice.lines?.data?.[0]?.price?.id;
          if (!priceId) {
            throw new BadRequestException('ID do preço não encontrado na fatura do Stripe');
          }
          const plan = this.getPlanFromPriceId(priceId);
          if (!plan) {
            throw new BadRequestException(`Preço Stripe não reconhecido: ${priceId}`);
          }
          const expiresAt = new Date(invoice.lines.data[0].period.end * 1000);
          await this.handleSubscriptionSuccess(stripeCustomerId, plan, expiresAt);
        }
        break;
      }
      default:
        break;
    }
  }

  /**
   * Mapeia um Stripe Price ID para o respectivo PlanType.
   */
  private getPlanFromPriceId(priceId: string): PlanType | null {
    const premiumPriceId = this.config.get<string>('STRIPE_PRICE_PREMIUM_ID');
    const proPriceId = this.config.get<string>('STRIPE_PRICE_PRO_ID');

    if (priceId === premiumPriceId) return PlanType.PREMIUM;
    if (priceId === proPriceId) return PlanType.PRO;
    return null;
  }

  /**
   * Atualiza o plano de um vendedor de forma manual (feito via suporte).
   */
  async updatePlanManually(sellerId: string, plan: PlanType, expiresAt: Date) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      throw new NotFoundException('Vendedor não encontrado');
    }

    return this.prisma.sellerProfile.update({
      where: { id: sellerId },
      data: {
        plan,
        planExpiresAt: expiresAt,
      },
    });
  }
}

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  PaymentProvider, 
  PaymentIntentResponse, 
  SubscriptionResponse 
} from '../interfaces/payment-provider.interface';

/**
 * StripeProvider — Implementação do provedor de pagamento utilizando o SDK do Stripe.
 * Nota: Requer a instalação do pacote 'stripe' (npm install stripe).
 */
@Injectable()
export class StripeProvider extends PaymentProvider {
  private stripe: any;

  constructor(private configService: ConfigService) {
    super();
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (!secretKey) {
      console.warn('STRIPE_SECRET_KEY não configurada no .env');
      return;
    }

    // Inicialização dinâmica para evitar erros de compilação caso o pacote não esteja presente
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Stripe = require('stripe');
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
      });
    } catch (e) {
      console.error('Falha ao inicializar o SDK do Stripe. Certifique-se de que o pacote "stripe" está instalado.');
    }
  }

  private ensureStripe() {
    if (!this.stripe) {
      throw new InternalServerErrorException('Provedor de pagamento (Stripe) não inicializado corretamente.');
    }
  }

  async createCustomer(email: string, name?: string): Promise<string> {
    this.ensureStripe();
    const customer = await this.stripe.customers.create({
      email,
      name,
    });
    return customer.id;
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntentResponse> {
    this.ensureStripe();
    const intent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      customer: params.customerId,
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    });

    return {
      id: intent.id,
      clientSecret: intent.client_secret,
      amount: intent.amount,
      status: intent.status,
    };
  }

  async createSubscription(params: {
    customerId: string;
    priceId: string;
    metadata?: Record<string, any>;
  }): Promise<SubscriptionResponse> {
    this.ensureStripe();
    const subscription = await this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    this.ensureStripe();
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean {
    this.ensureStripe();
    try {
      this.stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (err) {
      return false;
    }
  }
}

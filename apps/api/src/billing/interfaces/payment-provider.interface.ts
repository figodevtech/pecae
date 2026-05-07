export interface PaymentIntentResponse {
  id: string;
  clientSecret: string;
  amount: number;
  status: string;
}

export interface SubscriptionResponse {
  id: string;
  status: string;
  currentPeriodEnd: Date;
}

export abstract class PaymentProvider {
  abstract createCustomer(email: string, name?: string): Promise<string>;
  abstract createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntentResponse>;
  
  abstract createSubscription(params: {
    customerId: string;
    priceId: string;
    metadata?: Record<string, any>;
  }): Promise<SubscriptionResponse>;

  abstract cancelSubscription(subscriptionId: string): Promise<void>;
  
  abstract verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean;
}

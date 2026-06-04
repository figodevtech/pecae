import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { ConfigService } from '@nestjs/config';
import { PlanType, AdCampaignStatus } from '@prisma/client';
import { InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: PrismaService;
  let paymentProvider: PaymentProvider;
  let config: ConfigService;

  const mockPrisma: any = {
    sellerProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    adCampaign: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    listing: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (callback) => callback(mockPrisma)),
  };

  const mockPaymentProvider = {
    createCustomer: jest.fn(),
    createPaymentIntent: jest.fn(),
    createSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaymentProvider, useValue: mockPaymentProvider },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);
    paymentProvider = module.get<PaymentProvider>(PaymentProvider);
    config = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('subscribeToPlan', () => {
    it('deve assinar plano com sucesso usando Stripe priceId da config', async () => {
      const sellerId = 'seller-1';
      const plan = PlanType.PREMIUM;
      
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: sellerId,
        stripeCustomerId: 'cust-123',
        user: { email: 'seller@example.com' },
        storeName: 'Loja Alpha',
      });

      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'STRIPE_PRICE_PREMIUM_ID') return 'price_premium_123';
        return null;
      });

      mockPaymentProvider.createSubscription.mockResolvedValue({
        id: 'sub-123',
        status: 'active',
        currentPeriodEnd: new Date(),
      });

      const result = await service.subscribeToPlan(sellerId, plan);

      expect(result).toBeDefined();
      expect(mockPaymentProvider.createSubscription).toHaveBeenCalledWith({
        customerId: 'cust-123',
        priceId: 'price_premium_123',
        metadata: { sellerId, plan },
      });
    });

    it('deve lancar BadRequestException para plano FREE', async () => {
      await expect(service.subscribeToPlan('seller-1', PlanType.FREE)).rejects.toThrow(BadRequestException);
    });

    it('deve lancar InternalServerErrorException se o priceId nao estiver configurado', async () => {
      const sellerId = 'seller-1';
      
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: sellerId,
        stripeCustomerId: 'cust-123',
        user: { email: 'seller@example.com' },
        storeName: 'Loja Alpha',
      });

      mockConfig.get.mockReturnValue(null); // priceId ausente

      await expect(service.subscribeToPlan(sellerId, PlanType.PREMIUM)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('createFeaturedAdIntent', () => {
    it('deve criar intencao de destaque com sucesso para anuncio publicado', async () => {
      const listingId = 'list-1';
      const sellerId = 'seller-1';
      const days = 5;

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        status: 'PUBLISHED',
        deletedAt: null,
      });

      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: sellerId,
        stripeCustomerId: 'cust-123',
        user: { email: 'seller@example.com' },
        storeName: 'Loja Alpha',
      });

      mockPaymentProvider.createPaymentIntent.mockResolvedValue({
        id: 'pi_123',
        clientSecret: 'secret_123',
        amount: 2500,
        status: 'requires_payment_method',
      });

      const result = await service.createFeaturedAdIntent(listingId, sellerId, days);

      expect(result).toBeDefined();
      expect(result.id).toBe('pi_123');
      expect(mockPrisma.adCampaign.create).toHaveBeenCalledWith({
        data: {
          listingId,
          status: AdCampaignStatus.PENDING_PAYMENT,
          budget: 25,
          spent: 0,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          externalPaymentId: 'pi_123',
        },
      });
    });

    it('deve lancar NotFoundException se o anuncio nao existir', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      await expect(service.createFeaturedAdIntent('list-invalido', 'seller-1', 5)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lancar BadRequestException se o anuncio nao estiver PUBLISHED', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: 'list-1',
        status: 'DRAFT',
        deletedAt: null,
      });

      await expect(service.createFeaturedAdIntent('list-1', 'seller-1', 5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lancar BadRequestException se a quantidade de dias for menor ou igual a zero', async () => {
      await expect(service.createFeaturedAdIntent('list-1', 'seller-1', 0)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('handleSubscriptionSuccess', () => {
    it('deve atualizar o plano e validade do plano no banco a partir do Stripe customer ID', async () => {
      const stripeCustomerId = 'cust-123';
      const plan = PlanType.PREMIUM;
      const expiresAt = new Date();

      mockPrisma.sellerProfile.findFirst.mockResolvedValue({
        id: 'seller-1',
        stripeCustomerId,
      });

      await service.handleSubscriptionSuccess(stripeCustomerId, plan, expiresAt);

      expect(mockPrisma.sellerProfile.update).toHaveBeenCalledWith({
        where: { id: 'seller-1' },
        data: {
          plan,
          planExpiresAt: expiresAt,
        },
      });
    });

    it('deve lancar NotFoundException se o vendedor nao for encontrado', async () => {
      mockPrisma.sellerProfile.findFirst.mockResolvedValue(null);

      await expect(
        service.handleSubscriptionSuccess('cust-invalido', PlanType.PREMIUM, new Date())
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePlanManually', () => {
    it('deve atualizar o plano e validade manualmente via suporte', async () => {
      const sellerId = 'seller-1';
      const plan = PlanType.PRO;
      const expiresAt = new Date();

      mockPrisma.sellerProfile.findUnique.mockResolvedValue({
        id: sellerId,
      });

      await service.updatePlanManually(sellerId, plan, expiresAt);

      expect(mockPrisma.sellerProfile.update).toHaveBeenCalledWith({
        where: { id: sellerId },
        data: {
          plan,
          planExpiresAt: expiresAt,
        },
      });
    });

    it('deve lancar NotFoundException se vendedor nao existir', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePlanManually('seller-invalido', PlanType.PRO, new Date())
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('processStripeWebhookEvent', () => {
    it('deve processar payment_intent.succeeded ativando a campanha de destaque', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
          },
        },
      };

      mockPrisma.adCampaign.findFirst.mockResolvedValue({
        id: 'camp-1',
        listingId: 'list-1',
        externalPaymentId: 'pi_123',
      });

      await service.processStripeWebhookEvent(event);

      expect(mockPrisma.adCampaign.update).toHaveBeenCalledWith({
        where: { id: 'camp-1' },
        data: { status: AdCampaignStatus.ACTIVE },
      });
      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: { isSponsoredActive: true },
      });
    });

    it('deve processar customer.subscription.updated atualizando o plano do vendedor', async () => {
      const currentPeriodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cust-123',
            status: 'active',
            current_period_end: currentPeriodEnd,
            items: {
              data: [
                {
                  price: {
                    id: 'price_premium_123',
                  },
                },
              ],
            },
          },
        },
      };

      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'STRIPE_PRICE_PREMIUM_ID') return 'price_premium_123';
        return null;
      });

      mockPrisma.sellerProfile.findFirst.mockResolvedValue({
        id: 'seller-1',
        stripeCustomerId: 'cust-123',
      });

      await service.processStripeWebhookEvent(event);

      expect(mockPrisma.sellerProfile.update).toHaveBeenCalledWith({
        where: { id: 'seller-1' },
        data: {
          plan: PlanType.PREMIUM,
          planExpiresAt: new Date(currentPeriodEnd * 1000),
        },
      });
    });

    it('deve processar invoice.payment_succeeded estendendo o plano do vendedor', async () => {
      const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const event = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'cust-123',
            subscription: 'sub-123',
            lines: {
              data: [
                {
                  price: {
                    id: 'price_pro_123',
                  },
                  period: {
                    end: periodEnd,
                  },
                },
              ],
            },
          },
        },
      };

      mockConfig.get.mockImplementation((key: string) => {
        if (key === 'STRIPE_PRICE_PRO_ID') return 'price_pro_123';
        return null;
      });

      mockPrisma.sellerProfile.findFirst.mockResolvedValue({
        id: 'seller-1',
        stripeCustomerId: 'cust-123',
      });

      await service.processStripeWebhookEvent(event);

      expect(mockPrisma.sellerProfile.update).toHaveBeenCalledWith({
        where: { id: 'seller-1' },
        data: {
          plan: PlanType.PRO,
          planExpiresAt: new Date(periodEnd * 1000),
        },
      });
    });
  });
});

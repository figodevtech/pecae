import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { ConfigService } from '@nestjs/config';
import { PlanType } from '@prisma/client';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../auth/guards/policies.guard';

describe('BillingController', () => {
  let controller: BillingController;
  let billingService: BillingService;
  let paymentProvider: PaymentProvider;
  let config: ConfigService;

  const mockBillingService = {
    processStripeWebhookEvent: jest.fn(),
    updatePlanManually: jest.fn(),
  };

  const mockPaymentProvider = {
    verifyWebhookSignature: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: BillingService, useValue: mockBillingService },
        { provide: PaymentProvider, useValue: mockPaymentProvider },
        { provide: ConfigService, useValue: mockConfig },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PoliciesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BillingController>(BillingController);
    billingService = module.get<BillingService>(BillingService);
    paymentProvider = module.get<PaymentProvider>(PaymentProvider);
    config = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleWebhook', () => {
    it('deve lancar BadRequestException se assinatura estiver ausente', async () => {
      const mockReq = { rawBody: Buffer.from('payload') } as any;
      await expect(controller.handleWebhook(mockReq, '')).rejects.toThrow(BadRequestException);
    });

    it('deve lancar BadRequestException se rawBody estiver ausente', async () => {
      const mockReq = {} as any;
      await expect(controller.handleWebhook(mockReq, 'sig-123')).rejects.toThrow(BadRequestException);
    });

    it('deve lancar BadRequestException se webhook secret nao estiver configurado', async () => {
      const mockReq = { rawBody: Buffer.from('payload') } as any;
      mockConfig.get.mockReturnValue(null);

      await expect(controller.handleWebhook(mockReq, 'sig-123')).rejects.toThrow(BadRequestException);
    });

    it('deve lancar UnauthorizedException se assinatura for invalida', async () => {
      const mockReq = { rawBody: Buffer.from('payload') } as any;
      mockConfig.get.mockReturnValue('whsec_secret');
      mockPaymentProvider.verifyWebhookSignature.mockReturnValue(false);

      await expect(controller.handleWebhook(mockReq, 'sig-invalid')).rejects.toThrow(UnauthorizedException);
    });

    it('deve processar o webhook com sucesso se assinatura for valida', async () => {
      const payloadObj = { id: 'evt_123', type: 'payment_intent.succeeded' };
      const rawBody = Buffer.from(JSON.stringify(payloadObj));
      const mockReq = { rawBody } as any;

      mockConfig.get.mockReturnValue('whsec_secret');
      mockPaymentProvider.verifyWebhookSignature.mockReturnValue(true);

      const result = await controller.handleWebhook(mockReq, 'sig-valid');

      expect(result).toEqual({ received: true });
      expect(mockPaymentProvider.verifyWebhookSignature).toHaveBeenCalledWith(rawBody, 'sig-valid', 'whsec_secret');
      expect(mockBillingService.processStripeWebhookEvent).toHaveBeenCalledWith(payloadObj);
    });
  });

  describe('updatePlanManually', () => {
    it('deve atualizar o plano manualmente com sucesso', async () => {
      const sellerId = 'seller-1';
      const dto = {
        plan: PlanType.PREMIUM,
        expiresAt: new Date(),
      };

      const mockUpdatedSeller = {
        id: sellerId,
        plan: PlanType.PREMIUM,
        planExpiresAt: dto.expiresAt,
      };

      mockBillingService.updatePlanManually.mockResolvedValue(mockUpdatedSeller);

      const result = await controller.updatePlanManually(sellerId, dto);

      expect(result).toEqual({
        message: 'Plano do vendedor atualizado com sucesso.',
        seller: {
          id: sellerId,
          plan: PlanType.PREMIUM,
          planExpiresAt: dto.expiresAt,
        },
      });
      expect(mockBillingService.updatePlanManually).toHaveBeenCalledWith(sellerId, dto.plan, dto.expiresAt);
    });
  });
});

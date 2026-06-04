import { 
  Controller, 
  Post, 
  Body, 
  Headers, 
  Req, 
  BadRequestException, 
  UnauthorizedException, 
  UseGuards, 
  Param, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { Public } from '../auth/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../auth/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { AppAbility } from '../auth/casl/casl-ability.factory';
import { Action } from '../auth/casl/action.enum';
import { UpdatePlanManualDto } from './dto/update-plan-manual.dto';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly paymentProvider: PaymentProvider,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RequestWithRawBody,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Assinatura Stripe ausente');
    }

    const payload = req.rawBody;
    if (!payload) {
      throw new BadRequestException('Payload rawBody ausente');
    }

    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET não configurado');
    }

    const isValid = this.paymentProvider.verifyWebhookSignature(payload, signature, secret);
    if (!isValid) {
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }

    const event = JSON.parse(payload.toString());
    await this.billingService.processStripeWebhookEvent(event);

    return { received: true };
  }

  @Post('admin/sellers/:sellerId/plan')
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, 'all'))
  async updatePlanManually(
    @Param('sellerId') sellerId: string,
    @Body() dto: UpdatePlanManualDto,
  ) {
    const updatedSeller = await this.billingService.updatePlanManually(
      sellerId,
      dto.plan,
      dto.expiresAt,
    );

    return {
      message: 'Plano do vendedor atualizado com sucesso.',
      seller: {
        id: updatedSeller.id,
        plan: updatedSeller.plan,
        planExpiresAt: updatedSeller.planExpiresAt,
      },
    };
  }
}

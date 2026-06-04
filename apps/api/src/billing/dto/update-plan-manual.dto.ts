import { IsEnum, IsDate, IsNotEmpty } from 'class-validator';
import { PlanType } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdatePlanManualDto {
  @IsEnum(PlanType)
  @IsNotEmpty()
  plan: PlanType;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  expiresAt: Date;
}

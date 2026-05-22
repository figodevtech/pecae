import { IsUUID, IsNotEmpty, IsNumber, IsDateString, IsOptional, Min, IsEnum, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BudgetType } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do anúncio (Listing)' })
  @IsUUID()
  @IsNotEmpty()
  listingId: string;

  @ApiProperty({ example: 500.00, description: 'Orçamento total da campanha' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  budget: number;

  @ApiProperty({ example: '2026-04-26T00:00:00.000Z', description: 'Data de início' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2026-05-26T00:00:00.000Z', description: 'Data de término (opcional)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID da Marca alvo (opcional)' })
  @IsUUID()
  @IsOptional()
  targetBrandId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do Modelo alvo (opcional)' })
  @IsUUID()
  @IsOptional()
  targetModelId?: string;

  @ApiProperty({ example: 2020, description: 'Ano do veículo alvo (opcional)' })
  @IsNumber()
  @Min(1900)
  @IsOptional()
  targetYear?: number;

  @ApiProperty({ example: 'São Paulo', description: 'Cidade alvo (opcional)' })
  @IsString()
  @IsOptional()
  targetCity?: string;

  @ApiProperty({ example: 'SP', description: 'Estado alvo (opcional)' })
  @IsString()
  @Length(2, 2)
  @IsOptional()
  targetState?: string;

  @ApiProperty({ example: 10000, description: 'Limite máximo de impressões (capping)' })
  @IsNumber()
  @Min(100)
  @IsOptional()
  maxImpressions?: number;

  @ApiProperty({ example: BudgetType.CPC, enum: BudgetType, description: 'Tipo de orçamento (CPC, CPM, FLAT_PERIOD)' })
  @IsEnum(BudgetType)
  @IsOptional()
  budgetType?: BudgetType;

  @ApiProperty({ example: 'Campanha de teste patrocinada', description: 'Observações/notas administrativas (opcional)' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'pay_123456', description: 'ID do pagamento externo (opcional)' })
  @IsString()
  @IsOptional()
  externalPaymentId?: string;
}

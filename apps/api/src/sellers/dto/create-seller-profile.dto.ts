import { IsString, IsEnum, IsOptional, IsObject, Matches, MinLength, ValidateIf } from 'class-validator';
import { SellerType } from '@prisma/client';

export class CreateSellerProfileDto {
  @IsString()
  @MinLength(3, { message: 'storeName must be at least 3 characters long' })
  storeName: string;

  @IsEnum(SellerType)
  type: SellerType;

  @ValidateIf(o => o.type === SellerType.PJ)
  @IsString()
  cnpj?: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsOptional()
  lat?: number;

  @IsOptional()
  lng?: number;

  @Matches(/^\+55\d{10,11}$/, { message: 'WhatsApp deve estar no formato +5511999999999' })
  whatsapp: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsObject()
  openHours?: Record<string, string>;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

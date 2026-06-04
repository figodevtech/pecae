import { IsString, IsEnum, IsOptional, IsObject, Matches, MinLength, ValidateIf, IsBoolean } from 'class-validator';
import { SellerType } from '@prisma/client';
import { IsCNPJ } from '../../common/decorators/is-cnpj.decorator';

export class CreateSellerProfileDto {
  @IsString()
  @MinLength(3, { message: 'storeName must be at least 3 characters long' })
  storeName: string;

  @IsEnum(SellerType)
  type: SellerType;

  @ValidateIf(o => o.type === SellerType.PJ)
  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, {
    message: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX ou 14 dígitos',
  })
  @IsCNPJ({ message: 'CNPJ inválido (dígitos verificadores incorretos)' })
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
  @IsBoolean()
  showContactInfo?: boolean;

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

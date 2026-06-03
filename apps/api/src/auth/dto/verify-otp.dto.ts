import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'Formato de telefone inválido.' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'O código deve ter exatamente 6 dígitos.' })
  code: string;
}

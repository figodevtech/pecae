import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Formato de telefone inválido. Use o padrão internacional (ex: +5511999999999)',
  })
  phone: string;
}

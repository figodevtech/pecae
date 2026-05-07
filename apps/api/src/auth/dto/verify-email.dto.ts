import { IsNotEmpty, IsString, IsHexadecimal, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Código de 6 dígitos recebido por e-mail' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsBoolean,
  Equals,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome completo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'joao@email.com', description: 'Endereço de e-mail' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Senha@123', description: 'Senha (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserType, example: UserType.BUYER })
  @IsEnum(UserType)
  @IsNotEmpty()
  type: UserType;

  @ApiProperty({ example: true, description: 'Aceite dos termos e política' })
  @IsBoolean()
  @Equals(true, { message: 'Você deve aceitar os termos de uso' })
  termsAccepted: boolean;
}

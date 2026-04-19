import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'usuario@pecae.com.br' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(1, { message: 'Senha é obrigatória' })
  password: string;
}

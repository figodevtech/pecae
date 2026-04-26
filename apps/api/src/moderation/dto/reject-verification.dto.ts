import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectVerificationDto {
  @IsString()
  @IsNotEmpty({ message: 'O motivo da rejeição é obrigatório.' })
  @MaxLength(500, { message: 'O motivo da rejeição deve ter no máximo 500 caracteres.' })
  reason: string;
}

import { IsString, MinLength, MaxLength } from 'class-validator';

export class RejectListingDto {
  @IsString()
  @MinLength(10, { message: 'O motivo de rejeição deve ter pelo menos 10 caracteres.' })
  @MaxLength(1000)
  rejectionReason: string;
}

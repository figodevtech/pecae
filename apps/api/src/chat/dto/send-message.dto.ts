import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'Conteúdo da mensagem textualmente' })
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  content: string;
}

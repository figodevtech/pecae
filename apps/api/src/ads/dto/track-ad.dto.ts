import { IsUUID, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrackAdDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID da campanha' })
  @IsUUID()
  @IsNotEmpty()
  campaignId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID do anúncio (Listing)' })
  @IsUUID()
  @IsNotEmpty()
  listingId: string;

  @ApiProperty({ example: '127.0.0.1', description: 'IP do usuário (opcional)' })
  @IsString()
  @IsOptional()
  ip?: string;
}

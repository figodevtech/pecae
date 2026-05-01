import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ description: 'ID do anúncio para iniciar o chat', required: false })
  @IsUUID()
  @IsOptional()
  listingId?: string;

  @ApiProperty({ description: 'ID do veículo para iniciar o chat', required: false })
  @IsUUID()
  @IsOptional()
  vehicleId?: string;
}

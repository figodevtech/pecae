import { IsString, IsOptional, IsUUID, IsArray, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PhotoType } from '@prisma/client';

export class CreateVehiclePhotoDto {
  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsNumber()
  order: number;

  @ApiProperty({ enum: PhotoType })
  @IsEnum(PhotoType)
  type: PhotoType;
}

export class CreateListingDto {
  @ApiProperty({ description: 'Título do anúncio' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Preço (opcional)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  // --- Vehicle Data ---
  @ApiProperty({ description: 'ID da versão do veículo (catálogo)' })
  @IsUUID()
  versionId: string;

  @ApiProperty({ description: 'ID do ano de fabricação (catálogo)' })
  @IsUUID()
  yearFabId: string;

  @ApiProperty({ description: 'Cor do veículo' })
  @IsString()
  color: string;

  @ApiProperty({ description: 'Placa (opcional)', required: false })
  @IsOptional()
  @IsString()
  plate?: string;

  @ApiProperty({ description: 'Cidade onde se encontra o veículo' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Estado (UF)' })
  @IsString()
  @Min(2)
  @Max(2)
  state: string;

  @ApiProperty({ description: 'IDs das categorias de peças disponíveis' })
  @IsArray()
  @IsString({ each: true })
  availableParts: string[];

  @ApiProperty({ type: [CreateVehiclePhotoDto] })
  @IsArray()
  photos: CreateVehiclePhotoDto[];

  @ApiProperty({ description: 'Observações adicionais', required: false })
  @IsOptional()
  @IsString()
  observations?: string;
}

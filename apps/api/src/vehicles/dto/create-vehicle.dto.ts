import { 
  IsArray, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUUID, 
  IsLatLong, 
  MaxLength, 
  Matches,
  IsNumber,
  ValidateIf
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new salvage vehicle (sucata) and its corresponding listing.
 * 
 * CRITICAL (RN04/RN05): MUST NOT contain price or chassis fields.
 */
export class CreateVehicleDto {
  @ApiProperty({ example: 'uuid-version-123', required: false })
  @IsOptional()
  @IsUUID()
  versionId?: string;

  @ApiProperty({ example: 'uuid-year-456', required: false })
  @IsOptional()
  @IsUUID()
  yearFabId?: string;

  @ApiProperty({ example: 'Fiat', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customBrandName?: string;

  @ApiProperty({ example: 'Uno', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customModelName?: string;

  @ApiProperty({ example: 'Mille 1.0 Flex', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customVersionName?: string;

  @ApiProperty({ example: 2012, required: false })
  @IsOptional()
  @IsNumber()
  customYearFab?: number;

  @ApiProperty({ example: 2013, required: false })
  @IsOptional()
  @IsNumber()
  customYearModel?: number;

  @ApiProperty({ example: 'Prata' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  color: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  state: string;

  @ApiProperty({ example: 'ABC-1234', required: false })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.plate && o.plate !== '')
  @Matches(/^[A-Z]{3}-?\d{4}$|^[A-Z]{3}[A-Z0-9]\d{3}$/, { 
    message: 'Placa deve estar no formato brasileiro ou Mercosul' 
  })
  plate?: string;

  @ApiProperty({ example: 'Veículo com batida frontal leve', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;

  @ApiProperty({ example: ['uuid-part-1', 'uuid-part-2'] })
  @IsArray()
  @IsUUID('all', { each: true })
  availableParts: string[];

  @ApiProperty({ example: -23.5505, required: false })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiProperty({ example: -46.6333, required: false })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiProperty({ 
    example: 'Sucata do Uno 2015 em ótimo estado de conservação interna' 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ 
    example: 'Descrição detalhada do anúncio...', 
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

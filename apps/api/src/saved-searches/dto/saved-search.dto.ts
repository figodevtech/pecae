import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateSavedSearchDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsObject()
  filters: any;

  @IsOptional()
  @IsBoolean()
  alertActive?: boolean;
}

export class UpdateSavedSearchDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsObject()
  filters?: any;

  @IsOptional()
  @IsBoolean()
  alertActive?: boolean;
}

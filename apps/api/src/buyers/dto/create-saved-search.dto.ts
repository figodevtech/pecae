import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class CreateSavedSearchDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsObject()
  @IsOptional()
  filters?: any;

  @IsBoolean()
  @IsOptional()
  alertActive?: boolean;
}

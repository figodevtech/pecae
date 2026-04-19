import { IsArray, IsString } from 'class-validator';

export class RequestVerificationDto {
  @IsArray()
  @IsString({ each: true })
  documentUrls: string[];
}

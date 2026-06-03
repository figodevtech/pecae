import { IsEnum, IsString, IsOptional, IsUUID } from 'class-validator';
import { ReportCategory } from '@prisma/client';

export class CreateReportDto {
  @IsEnum(ReportCategory)
  category: ReportCategory;

  @IsString()
  reason: string;

  @IsUUID()
  @IsOptional()
  listingId?: string;

  @IsUUID()
  @IsOptional()
  reportedUserId?: string;

  @IsUUID()
  @IsOptional()
  chatRoomId?: string;
}

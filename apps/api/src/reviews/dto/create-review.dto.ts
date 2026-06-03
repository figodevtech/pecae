import { IsString, IsInt, Min, Max, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  sellerProfileId: string;

  @IsString()
  chatRoomId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  comment?: string;
}

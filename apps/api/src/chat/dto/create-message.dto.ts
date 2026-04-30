import { IsString, IsUUID, MinLength, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsUUID()
  roomId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  content: string;
}

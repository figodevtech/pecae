import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvailablePartsDto {
  @ApiProperty({ example: ['uuid-part-1', 'uuid-part-2'] })
  @IsArray()
  @IsUUID('all', { each: true })
  partIds: string[];
}

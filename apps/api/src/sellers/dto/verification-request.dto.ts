import { IsArray, IsString, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerificationRequestDto {
  @ApiProperty({
    description: 'Lista de caminhos dos documentos no storage',
    example: ['sellers/123/identity.pdf', 'sellers/123/selfie.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  documentUrls: string[];
}

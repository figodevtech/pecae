import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppleAuthDto {
  @ApiProperty({ description: 'Apple identity token (JWT) from the Sign in with Apple flow.' })
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ApiPropertyOptional({
    description: 'Full name from Apple. Only sent on the FIRST sign-in — must be persisted immediately.',
    example: 'João Silva',
  })
  @IsString()
  @IsOptional()
  fullName?: string;
}

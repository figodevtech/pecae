import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token obtained from the OAuth2 flow on the client.' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

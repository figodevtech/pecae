import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserType } from '@prisma/client';

export class UpdateRoleDto {
  @IsEnum(UserType)
  @IsNotEmpty()
  role: UserType;
}

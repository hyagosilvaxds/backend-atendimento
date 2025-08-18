import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.ORG_USER;
}

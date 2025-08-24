import { IsString, IsOptional, IsEmail, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateContactDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @Transform(({ value }) => value === '' ? undefined : value)
  email?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean = true;

  @IsOptional()
  @IsString({ each: true })
  tagIds?: string[];
}

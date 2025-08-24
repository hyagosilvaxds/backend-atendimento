import { IsOptional, IsString, IsArray } from 'class-validator';

export class ExportContactsDto {
  @IsOptional()
  @IsString()
  format?: 'xlsx' | 'csv' = 'xlsx';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactIds?: string[];

  @IsOptional()
  @IsString()
  tagId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

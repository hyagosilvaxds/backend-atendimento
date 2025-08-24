import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ImportTemplateDto {
  @IsString()
  name: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  messageType?: string = 'text';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  weight?: number = 1;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class ImportTemplatesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportTemplateDto)
  templates: ImportTemplateDto[];

  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean = false;
}

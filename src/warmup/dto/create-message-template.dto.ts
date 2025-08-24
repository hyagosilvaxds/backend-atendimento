import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';

export class CreateMessageTemplateDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['text', 'image', 'audio', 'document', 'video'])
  messageType?: string = 'text';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  weight?: number = 1;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @IsOptional()
  @IsString()
  mediaFileId?: string; // ID do arquivo de mídia associado
}

export class CreateTemplateWithFileDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['image', 'audio', 'document', 'video'])
  fileType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  weight?: number = 1;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

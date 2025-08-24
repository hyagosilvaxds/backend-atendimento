import { IsString, IsEnum, IsOptional } from 'class-validator';

export class UploadMediaFileDto {
  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsEnum(['image', 'audio', 'video', 'document'])
  fileType?: string;
}

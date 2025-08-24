import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { WhatsAppSessionType } from '@prisma/client';

export class CreateWhatsAppSessionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(WhatsAppSessionType)
  type?: WhatsAppSessionType;

  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}

export class SendMessageDto {
  @IsString()
  to: string;

  @IsString()
  message: string;
}

export class UpdateWhatsAppSessionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}

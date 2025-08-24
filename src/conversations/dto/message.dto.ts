import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  LOCATION = 'LOCATION',
  CONTACT = 'CONTACT',
  STICKER = 'STICKER',
  REACTION = 'REACTION',
  POLL = 'POLL',
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

export class CreateMessageDto {
  @ApiProperty({ description: 'ID da conversa' })
  @IsString()
  conversationId: string;

  @ApiProperty({ enum: MessageType, description: 'Tipo da mensagem' })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ description: 'Conteúdo da mensagem', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'URL da mídia', required: false })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiProperty({ description: 'Legenda da mídia', required: false })
  @IsString()
  @IsOptional()
  mediaCaption?: string;

  @ApiProperty({ description: 'Nome do arquivo', required: false })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiProperty({ description: 'Tamanho do arquivo em bytes', required: false })
  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @ApiProperty({ description: 'Tipo MIME do arquivo', required: false })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiProperty({ description: 'ID da mensagem citada', required: false })
  @IsString()
  @IsOptional()
  quotedMessageId?: string;

  @ApiProperty({ description: 'Se é uma mensagem encaminhada', required: false })
  @IsBoolean()
  @IsOptional()
  isForwarded?: boolean;
}

export class UpdateMessageDto {
  @ApiProperty({ description: 'Conteúdo da mensagem', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'Legenda da mídia', required: false })
  @IsString()
  @IsOptional()
  mediaCaption?: string;

  @ApiProperty({ enum: MessageStatus, description: 'Status da mensagem', required: false })
  @IsEnum(MessageStatus)
  @IsOptional()
  status?: MessageStatus;

  @ApiProperty({ description: 'Se está estrelada', required: false })
  @IsBoolean()
  @IsOptional()
  isStarred?: boolean;

  @ApiProperty({ description: 'Data de entrega', required: false })
  @IsDateString()
  @IsOptional()
  deliveredAt?: string;

  @ApiProperty({ description: 'Data de leitura', required: false })
  @IsDateString()
  @IsOptional()
  readAt?: string;
}

export class MarkAsReadDto {
  @ApiProperty({ description: 'IDs das mensagens para marcar como lidas' })
  @IsString({ each: true })
  messageIds: string[];
}

export class MessageReactionDto {
  @ApiProperty({ description: 'Emoji da reação' })
  @IsString()
  emoji: string;
}

export class SendMessageDto {
  @ApiProperty({ description: 'ID da conversa ou chat' })
  @IsString()
  chatId: string;

  @ApiProperty({ enum: MessageType, description: 'Tipo da mensagem' })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ description: 'Conteúdo da mensagem', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'URL da mídia', required: false })
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @ApiProperty({ description: 'Legenda da mídia', required: false })
  @IsString()
  @IsOptional()
  mediaCaption?: string;

  @ApiProperty({ description: 'ID da mensagem citada', required: false })
  @IsString()
  @IsOptional()
  quotedMessageId?: string;
}

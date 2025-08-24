import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum ConversationType {
  CONTACT = 'CONTACT',
  GROUP = 'GROUP',
  BROADCAST = 'BROADCAST',
}

export class CreateConversationDto {
  @ApiProperty({ enum: ConversationType, description: 'Tipo da conversa' })
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiProperty({ description: 'ID do chat no WhatsApp' })
  @IsString()
  chatId: string;

  @ApiProperty({ description: 'Nome da conversa', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Descrição da conversa', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'URL do avatar', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ description: 'ID da sessão WhatsApp' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'ID do contato (para conversas individuais)', required: false })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiProperty({ description: 'IDs dos usuários com acesso', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];
}

export class UpdateConversationDto {
  @ApiProperty({ description: 'Nome da conversa', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Descrição da conversa', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'URL do avatar', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ description: 'Se está ativa', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Se está arquivada', required: false })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiProperty({ description: 'Se está fixada', required: false })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @ApiProperty({ description: 'Se está silenciada', required: false })
  @IsBoolean()
  @IsOptional()
  isMuted?: boolean;
}

export class ConversationParticipantDto {
  @ApiProperty({ description: 'ID do participante no WhatsApp' })
  @IsString()
  participantId: string;

  @ApiProperty({ description: 'Nome do participante' })
  @IsString()
  participantName: string;

  @ApiProperty({ description: 'Telefone do participante', required: false })
  @IsString()
  @IsOptional()
  participantPhone?: string;

  @ApiProperty({ description: 'Se é administrador', required: false })
  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;
}

export class AddParticipantsDto {
  @ApiProperty({ type: [ConversationParticipantDto], description: 'Participantes a serem adicionados' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationParticipantDto)
  participants: ConversationParticipantDto[];
}

export class AssignUserDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Pode ler mensagens', required: false })
  @IsBoolean()
  @IsOptional()
  canRead?: boolean;

  @ApiProperty({ description: 'Pode escrever mensagens', required: false })
  @IsBoolean()
  @IsOptional()
  canWrite?: boolean;

  @ApiProperty({ description: 'Pode gerenciar a conversa', required: false })
  @IsBoolean()
  @IsOptional()
  canManage?: boolean;
}

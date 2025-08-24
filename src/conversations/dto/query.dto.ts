import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class QueryConversationsDto {
  @ApiProperty({ description: 'Página', required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: 'Itens por página', required: false, default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number = 20;

  @ApiProperty({ description: 'Buscar por nome ou telefone', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filtrar por tipo', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Mostrar apenas arquivadas', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  archived?: boolean;

  @ApiProperty({ description: 'Mostrar apenas fixadas', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  pinned?: boolean;

  @ApiProperty({ description: 'Filtrar por sessão', required: false })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ description: 'Mostrar apenas com mensagens não lidas', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  unread?: boolean;
}

export class QueryMessagesDto {
  @ApiProperty({ description: 'Página', required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: 'Itens por página', required: false, default: 50 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number = 50;

  @ApiProperty({ description: 'Buscar no conteúdo das mensagens', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filtrar por tipo de mensagem', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Data de início (ISO)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Data de fim (ISO)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Apenas mensagens enviadas por nós', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  fromMe?: boolean;

  @ApiProperty({ description: 'Apenas mensagens estreladas', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  starred?: boolean;

  @ApiProperty({ description: 'Filtrar por status', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}

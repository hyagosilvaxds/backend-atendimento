import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { 
  CreateMessageDto, 
  UpdateMessageDto, 
  MarkAsReadDto, 
  MessageReactionDto,
  SendMessageDto
} from './dto/message.dto';
import { QueryMessagesDto } from './dto/query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { 
  CanCreateMessages,
  CanReadMessages,
  CanUpdateMessages,
  CanDeleteMessages
} from '../auth/decorators/permissions.decorator';

@ApiTags('Mensagens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @CanCreateMessages()
  @ApiOperation({ summary: 'Criar nova mensagem' })
  @ApiResponse({ status: 201, description: 'Mensagem criada com sucesso' })
  create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.messagesService.create(
      createMessageDto, 
      req.user.organizationId, 
      req.user.id
    );
  }

  @Post('send/:sessionId')
  @CanCreateMessages()
  @ApiOperation({ summary: 'Enviar mensagem via WhatsApp' })
  @ApiResponse({ status: 201, description: 'Mensagem enviada com sucesso' })
  sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() sendMessageDto: SendMessageDto, 
    @Request() req
  ) {
    return this.messagesService.sendMessage(
      sendMessageDto,
      sessionId,
      req.user.organizationId,
      req.user.id
    );
  }

  @Get('conversation/:conversationId')
  @CanReadMessages()
  @ApiOperation({ summary: 'Listar mensagens de uma conversa' })
  @ApiResponse({ status: 200, description: 'Lista de mensagens' })
  findAll(
    @Param('conversationId') conversationId: string,
    @Query() query: QueryMessagesDto, 
    @Request() req
  ) {
    return this.messagesService.findAll(
      conversationId, 
      query, 
      req.user.organizationId, 
      req.user.id
    );
  }

  @Get('conversation/:conversationId/stats')
  @CanReadMessages()
  @ApiOperation({ summary: 'Estatísticas das mensagens de uma conversa' })
  @ApiResponse({ status: 200, description: 'Estatísticas das mensagens' })
  getStats(@Param('conversationId') conversationId: string, @Request() req) {
    return this.messagesService.getStats(conversationId, req.user.organizationId);
  }

  @Get(':id')
  @CanReadMessages()
  @ApiOperation({ summary: 'Buscar mensagem por ID' })
  @ApiResponse({ status: 200, description: 'Mensagem encontrada' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.messagesService.findOne(id, req.user.organizationId, req.user.id);
  }

  @Patch(':id')
  @CanUpdateMessages()
  @ApiOperation({ summary: 'Atualizar mensagem' })
  @ApiResponse({ status: 200, description: 'Mensagem atualizada com sucesso' })
  update(
    @Param('id') id: string, 
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req
  ) {
    return this.messagesService.update(
      id, 
      updateMessageDto, 
      req.user.organizationId,
      req.user.id
    );
  }

  @Delete(':id')
  @CanDeleteMessages()
  @ApiOperation({ summary: 'Remover mensagem' })
  @ApiResponse({ status: 200, description: 'Mensagem removida com sucesso' })
  remove(@Param('id') id: string, @Request() req) {
    return this.messagesService.remove(id, req.user.organizationId, req.user.id);
  }

  @Post('conversation/:conversationId/read')
  @CanReadMessages()
  @ApiOperation({ summary: 'Marcar mensagens como lidas' })
  @ApiResponse({ status: 200, description: 'Mensagens marcadas como lidas' })
  markAsRead(
    @Param('conversationId') conversationId: string,
    @Body() markAsReadDto: MarkAsReadDto,
    @Request() req
  ) {
    return this.messagesService.markAsRead(
      markAsReadDto,
      conversationId,
      req.user.id
    );
  }

  @Post(':id/reaction')
  @CanCreateMessages()
  @ApiOperation({ summary: 'Adicionar/remover reação à mensagem' })
  @ApiResponse({ status: 200, description: 'Reação adicionada/removida com sucesso' })
  addReaction(
    @Param('id') id: string,
    @Body() reactionDto: MessageReactionDto,
    @Request() req
  ) {
    return this.messagesService.addReaction(
      id,
      reactionDto,
      req.user.organizationId,
      req.user.id
    );
  }
}

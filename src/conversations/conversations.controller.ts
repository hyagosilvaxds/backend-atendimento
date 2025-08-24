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
import { ConversationsService } from './conversations.service';
import { 
  CreateConversationDto, 
  UpdateConversationDto, 
  AddParticipantsDto, 
  AssignUserDto 
} from './dto/conversation.dto';
import { QueryConversationsDto } from './dto/query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { 
  CanCreateConversations,
  CanReadConversations,
  CanUpdateConversations,
  CanDeleteConversations,
  CanManageConversations
} from '../auth/decorators/permissions.decorator';

@ApiTags('Conversações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @CanCreateConversations()
  @ApiOperation({ summary: 'Criar nova conversa' })
  @ApiResponse({ status: 201, description: 'Conversa criada com sucesso' })
  create(@Body() createConversationDto: CreateConversationDto, @Request() req) {
    return this.conversationsService.create(createConversationDto, req.user.organizationId);
  }

  @Get()
  @CanReadConversations()
  @ApiOperation({ summary: 'Listar conversas' })
  @ApiResponse({ status: 200, description: 'Lista de conversas' })
  findAll(@Query() query: QueryConversationsDto, @Request() req) {
    return this.conversationsService.findAll(
      query, 
      req.user.organizationId, 
      req.user.id
    );
  }

  @Get('stats')
  @CanReadConversations()
  @ApiOperation({ summary: 'Estatísticas das conversas' })
  @ApiResponse({ status: 200, description: 'Estatísticas das conversas' })
  getStats(@Request() req) {
    return this.conversationsService.getStats(req.user.organizationId, req.user.id);
  }

  @Get(':id')
  @CanReadConversations()
  @ApiOperation({ summary: 'Buscar conversa por ID' })
  @ApiResponse({ status: 200, description: 'Conversa encontrada' })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.conversationsService.findOne(id, req.user.organizationId, req.user.id);
  }

  @Patch(':id')
  @CanUpdateConversations()
  @ApiOperation({ summary: 'Atualizar conversa' })
  @ApiResponse({ status: 200, description: 'Conversa atualizada com sucesso' })
  update(
    @Param('id') id: string, 
    @Body() updateConversationDto: UpdateConversationDto,
    @Request() req
  ) {
    return this.conversationsService.update(
      id, 
      updateConversationDto, 
      req.user.organizationId,
      req.user.id
    );
  }

  @Delete(':id')
  @CanDeleteConversations()
  @ApiOperation({ summary: 'Remover conversa' })
  @ApiResponse({ status: 200, description: 'Conversa removida com sucesso' })
  remove(@Param('id') id: string, @Request() req) {
    return this.conversationsService.remove(id, req.user.organizationId, req.user.id);
  }

  @Post(':id/participants')
  @CanManageConversations()
  @ApiOperation({ summary: 'Adicionar participantes ao grupo' })
  @ApiResponse({ status: 200, description: 'Participantes adicionados com sucesso' })
  addParticipants(
    @Param('id') id: string,
    @Body() addParticipantsDto: AddParticipantsDto,
    @Request() req
  ) {
    return this.conversationsService.addParticipants(
      id,
      addParticipantsDto,
      req.user.organizationId
    );
  }

  @Delete(':id/participants/:participantId')
  @CanManageConversations()
  @ApiOperation({ summary: 'Remover participante do grupo' })
  @ApiResponse({ status: 200, description: 'Participante removido com sucesso' })
  removeParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @Request() req
  ) {
    return this.conversationsService.removeParticipant(
      id,
      participantId,
      req.user.organizationId
    );
  }

  @Post(':id/assign')
  @CanManageConversations()
  @ApiOperation({ summary: 'Atribuir usuário à conversa' })
  @ApiResponse({ status: 200, description: 'Usuário atribuído com sucesso' })
  assignUser(
    @Param('id') id: string,
    @Body() assignUserDto: AssignUserDto,
    @Request() req
  ) {
    return this.conversationsService.assignUser(id, assignUserDto, req.user.organizationId);
  }

  @Delete(':id/assign/:userId')
  @CanManageConversations()
  @ApiOperation({ summary: 'Desatribuir usuário da conversa' })
  @ApiResponse({ status: 200, description: 'Usuário desatribuído com sucesso' })
  unassignUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req
  ) {
    return this.conversationsService.unassignUser(id, userId, req.user.organizationId);
  }

  @Post(':id/read')
  @CanReadConversations()
  @ApiOperation({ summary: 'Marcar conversa como lida' })
  @ApiResponse({ status: 200, description: 'Conversa marcada como lida' })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.conversationsService.markAsRead(id, req.user.id, req.user.organizationId);
  }
}

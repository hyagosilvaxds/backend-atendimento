import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CanCreateSessions,
  CanReadSessions,
  CanUpdateSessions,
  CanDeleteSessions,
  CanManageSessions,
} from '../auth/decorators/permissions.decorator';

@Controller('sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionsController {
  /**
   * @route GET /sessions
   * @desc Listar sessões de atendimento
   * @access Private (Requer permissão READ_SESSIONS)
   */
  @CanReadSessions()
  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    return {
      message: 'Listando sessões',
      user: user.name,
      permissions: user.permissions,
      filters: query,
    };
  }

  /**
   * @route POST /sessions
   * @desc Criar nova sessão de atendimento
   * @access Private (Requer permissão CREATE_SESSIONS)
   */
  @CanCreateSessions()
  @Post()
  async create(@Body() createSessionDto: any, @CurrentUser() user: any) {
    return {
      message: 'Sessão criada com sucesso',
      data: createSessionDto,
      createdBy: user.name,
    };
  }

  /**
   * @route GET /sessions/:id
   * @desc Obter sessão específica
   * @access Private (Requer permissão READ_SESSIONS)
   */
  @CanReadSessions()
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return {
      message: `Sessão ${id}`,
      accessedBy: user.name,
    };
  }

  /**
   * @route PUT /sessions/:id
   * @desc Atualizar sessão
   * @access Private (Requer permissão UPDATE_SESSIONS)
   */
  @CanUpdateSessions()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSessionDto: any,
    @CurrentUser() user: any,
  ) {
    return {
      message: `Sessão ${id} atualizada`,
      data: updateSessionDto,
      updatedBy: user.name,
    };
  }

  /**
   * @route DELETE /sessions/:id
   * @desc Deletar sessão
   * @access Private (Requer permissão DELETE_SESSIONS)
   */
  @CanDeleteSessions()
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return {
      message: `Sessão ${id} removida`,
      removedBy: user.name,
    };
  }

  /**
   * @route POST /sessions/:id/assign
   * @desc Atribuir sessão a um atendente
   * @access Private (Requer permissão MANAGE_SESSIONS)
   */
  @CanManageSessions()
  @Post(':id/assign')
  async assignSession(
    @Param('id') id: string,
    @Body() assignDto: { userId: string },
    @CurrentUser() user: any,
  ) {
    return {
      message: `Sessão ${id} atribuída ao usuário ${assignDto.userId}`,
      assignedBy: user.name,
    };
  }

  /**
   * @route POST /sessions/:id/close
   * @desc Fechar sessão
   * @access Private (Requer permissão UPDATE_SESSIONS)
   */
  @CanUpdateSessions()
  @Post(':id/close')
  async closeSession(@Param('id') id: string, @CurrentUser() user: any) {
    return {
      message: `Sessão ${id} fechada`,
      closedBy: user.name,
    };
  }
}

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
  CanCreateContacts,
  CanReadContacts,
  CanUpdateContacts,
  CanDeleteContacts,
  CanManageContacts,
} from '../auth/decorators/permissions.decorator';

@Controller('contacts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContactsController {
  /**
   * @route GET /contacts
   * @desc Listar contatos
   * @access Private (Requer permissão READ_CONTACTS)
   */
  @CanReadContacts()
  @Get()
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    return {
      message: 'Listando contatos',
      user: user.name,
      organizationId: user.organizationId,
      filters: query,
    };
  }

  /**
   * @route POST /contacts
   * @desc Criar novo contato
   * @access Private (Requer permissão CREATE_CONTACTS)
   */
  @CanCreateContacts()
  @Post()
  async create(@Body() createContactDto: any, @CurrentUser() user: any) {
    return {
      message: 'Contato criado com sucesso',
      data: createContactDto,
      createdBy: user.name,
      organizationId: user.organizationId,
    };
  }

  /**
   * @route GET /contacts/:id
   * @desc Obter contato específico
   * @access Private (Requer permissão READ_CONTACTS)
   */
  @CanReadContacts()
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return {
      message: `Contato ${id}`,
      accessedBy: user.name,
    };
  }

  /**
   * @route PUT /contacts/:id
   * @desc Atualizar contato
   * @access Private (Requer permissão UPDATE_CONTACTS)
   */
  @CanUpdateContacts()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: any,
    @CurrentUser() user: any,
  ) {
    return {
      message: `Contato ${id} atualizado`,
      data: updateContactDto,
      updatedBy: user.name,
    };
  }

  /**
   * @route DELETE /contacts/:id
   * @desc Deletar contato
   * @access Private (Requer permissão DELETE_CONTACTS)
   */
  @CanDeleteContacts()
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return {
      message: `Contato ${id} removido`,
      removedBy: user.name,
    };
  }

  /**
   * @route POST /contacts/import
   * @desc Importar contatos em lote
   * @access Private (Requer permissão MANAGE_CONTACTS)
   */
  @CanManageContacts()
  @Post('import')
  async importContacts(@Body() importDto: any, @CurrentUser() user: any) {
    return {
      message: 'Contatos importados com sucesso',
      count: importDto.contacts?.length || 0,
      importedBy: user.name,
    };
  }

  /**
   * @route GET /contacts/:id/sessions
   * @desc Obter sessões de um contato
   * @access Private (Requer permissão READ_CONTACTS)
   */
  @CanReadContacts()
  @Get(':id/sessions')
  async getContactSessions(@Param('id') id: string, @CurrentUser() user: any) {
    return {
      message: `Sessões do contato ${id}`,
      accessedBy: user.name,
    };
  }

  /**
   * @route POST /contacts/:id/tag
   * @desc Adicionar tag a um contato
   * @access Private (Requer permissão UPDATE_CONTACTS)
   */
  @CanUpdateContacts()
  @Post(':id/tag')
  async addTag(
    @Param('id') id: string,
    @Body() tagDto: { tagId: string },
    @CurrentUser() user: any,
  ) {
    return {
      message: `Tag adicionada ao contato ${id}`,
      tagId: tagDto.tagId,
      addedBy: user.name,
    };
  }
}

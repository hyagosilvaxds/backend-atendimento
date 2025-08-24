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
  UseInterceptors,
  UploadedFile,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
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
import { ContactsService } from './contacts.service';
import { TagsService } from './tags.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { ExportContactsDto } from './dto/export-contacts.dto';
import { ImportContactsDto } from './dto/import-contacts.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ValidatePhoneDto } from './dto/validate-phone.dto';

@Controller('contacts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly tagsService: TagsService,
  ) {}

  /**
   * @route GET /contacts/template
   * @desc Baixar template para importação
   * @access Private (Requer permissão READ_CONTACTS)
   */
  @CanReadContacts()
  @Get('template')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.contactsService.getImportTemplate();
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-contatos.xlsx"',
      'Content-Length': (buffer as any).length,
    });
    
    res.send(buffer);
  }

  /**
   * @route GET /contacts/export
   * @desc Exportar contatos
   * @access Private (Requer permissão READ_CONTACTS)
   */
  @CanReadContacts()
  @Get('export')
  async exportContacts(
    @Query() exportDto: ExportContactsDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const buffer = await this.contactsService.exportContacts(exportDto, user.organizationId);
    
    const filename = `contatos-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': (buffer as any).length,
    });
    
    res.send(buffer);
  }

  /**
   * @route GET /contacts
   * @desc Listar contatos
   * @access Private (Requer permissão READ_CONTACTS)
   */
  @CanReadContacts()
  @Get()
  async findAll(
    @CurrentUser() user: any, 
    @Query(new ValidationPipe({ transform: true })) query: QueryContactsDto
  ) {
    return this.contactsService.findAll(query, user.organizationId);
  }

  /**
   * @route POST /contacts/import
   * @desc Importar contatos via Excel
   * @access Private (Requer permissão MANAGE_CONTACTS)
   */
  @CanManageContacts()
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFromFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ 
            fileType: /(xlsx|xls|csv)$/
          }),
        ],
      }),
    ) file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    const contacts = await this.contactsService.parseExcelFile(file.buffer);
    const importDto: ImportContactsDto = { contacts };
    return this.contactsService.importContacts(importDto, user.sub, user.organizationId);
  }

  /**
   * @route POST /contacts/import/json
   * @desc Importar contatos via JSON
   * @access Private (Requer permissão MANAGE_CONTACTS)
   */
  @CanManageContacts()
  @Post('import/json')
  /**
   * @route POST /contacts/import/json
   * @desc Importar contatos via JSON
   * @access Private (Requer permissão MANAGE_CONTACTS)
   */
  @CanManageContacts()
  @Post('import/json')
  async importFromJson(@Body() importDto: ImportContactsDto, @CurrentUser() user: any) {
    return this.contactsService.importContacts(importDto, user.sub, user.organizationId);
  }

  /**
   * @route POST /contacts
   * @desc Criar novo contato
   * @access Private (Requer permissão CREATE_CONTACTS)
   */
  @CanCreateContacts()
  @Post()
  async create(@Body() createContactDto: CreateContactDto, @CurrentUser() user: any) {
    return this.contactsService.create(createContactDto, user.sub, user.organizationId);
  }

  // ==================== TAGS ROUTES ====================

  /**
   * @route GET /contacts/tags
   * @desc Listar todas as tags
   * @access Private (Requer permissão READ_CONTACTS)
   */
  @CanReadContacts()
  @Get('tags')
  async getAllTags(@CurrentUser() user: any) {
    return this.tagsService.findAll(user.organizationId);
  }

  /**
   * @route POST /contacts/tags
   * @desc Criar nova tag
   * @access Private (Requer permissão CREATE_CONTACTS)
   */
  @CanCreateContacts()
  @Post('tags')
  async createTag(@Body() createTagDto: CreateTagDto, @CurrentUser() user: any) {
    return this.tagsService.create(createTagDto, user.organizationId);
  }

  /**
   * @route GET /contacts/tags/:id
   * @desc Obter tag específica
   * @access Private (Requer permissão READ_CONTACTS)
   */
  @CanReadContacts()
  @Get('tags/:id')
  async getTag(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tagsService.findOne(id, user.organizationId);
  }

  /**
   * @route PUT /contacts/tags/:id
   * @desc Atualizar tag
   * @access Private (Requer permissão UPDATE_CONTACTS)
   */
  @CanUpdateContacts()
  @Put('tags/:id')
  async updateTag(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
    @CurrentUser() user: any,
  ) {
    return this.tagsService.update(id, updateTagDto, user.organizationId);
  }

  /**
   * @route DELETE /contacts/tags/:id
   * @desc Deletar tag
   * @access Private (Requer permissão DELETE_CONTACTS)
   */
  @CanDeleteContacts()
  @Delete('tags/:id')
  async deleteTag(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tagsService.remove(id, user.organizationId);
  }

  /**
   * @route GET /contacts/tags/:id/contacts
   * @desc Obter contatos de uma tag
   * @access Private (Requer permissão READ_CONTACTS)
   */
  @CanReadContacts()
  @Get('tags/:id/contacts')
  async getContactsByTag(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: any,
  ) {
    return this.tagsService.getContactsByTag(
      id, 
      user.organizationId, 
      parseInt(page), 
      parseInt(limit)
    );
  }

  // ==================== CONTACTS ROUTES ====================

  /**
   * @route GET /contacts/:id
   * @desc Obter contato específico
   * @access Private (Requer permissão READ_CONTACTS)
   */
  @CanReadContacts()
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contactsService.findOne(id, user.organizationId);
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
    @Body() updateContactDto: UpdateContactDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.update(id, updateContactDto, user.organizationId);
  }

  /**
   * @route DELETE /contacts/:id
   * @desc Deletar contato
   * @access Private (Requer permissão DELETE_CONTACTS)
   */
  @CanDeleteContacts()
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contactsService.remove(id, user.organizationId);
  }

  /**
   * @route POST /contacts/:id/tags/:tagId
   * @desc Adicionar tag a um contato
   * @access Private (Requer permissão UPDATE_CONTACTS)
   */
  @CanUpdateContacts()
  @Post(':id/tags/:tagId')
  async addTag(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
    @CurrentUser() user: any,
  ) {
    await this.contactsService.addTagsToContact(id, [tagId], user.organizationId);
    return { message: 'Tag adicionada ao contato com sucesso' };
  }

  /**
   * @route DELETE /contacts/:id/tags/:tagId
   * @desc Remover tag de um contato
   * @access Private (Requer permissão UPDATE_CONTACTS)
   */
  @CanUpdateContacts()
  @Delete(':id/tags/:tagId')
  async removeTag(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.removeTagFromContact(id, tagId, user.organizationId);
  }

  /**
   * @route POST /contacts/validate-phone
   * @desc Validar número de WhatsApp
   * @access Private (Requer permissão CREATE_CONTACTS)
   */
  @CanCreateContacts()
  @Post('validate-phone')
  async validatePhone(
    @Body() validatePhoneDto: ValidatePhoneDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.validatePhoneNumber(validatePhoneDto.phone, user.organizationId);
  }
}

import { Controller, Post, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContactsService } from '../contacts/contacts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ValidatePhoneDto } from '../contacts/dto/validate-phone.dto';
import { ImportContactsDto } from '../contacts/dto/import-contacts.dto';

@Controller('test')
export class TestController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * @route POST /test/validate-phone
   * @desc Validar número de WhatsApp (endpoint público para testes)
   * @access Public
   */
  @Post('validate-phone')
  async validatePhone(@Body() validatePhoneDto: ValidatePhoneDto) {
    // Para testes, usar a primeira organização disponível
    const organization = await this.prisma.organization.findFirst();
    if (!organization) {
      return { error: 'Nenhuma organização encontrada para teste' };
    }
    return this.contactsService.validatePhoneNumber(validatePhoneDto.phone, organization.id);
  }

  /**
   * @route POST /test/debug-file
   * @desc Debug de arquivo recebido
   * @access Public
   */
  @Post('debug-file')
  @UseInterceptors(FileInterceptor('file'))
  async debugFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: 'Nenhum arquivo recebido' };
    }

    return {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer_length: file.buffer?.length || 'undefined',
      buffer_type: typeof file.buffer,
      success: true
    };
  }

  /**
   * @route POST /test/import-contacts
   * @desc Importar contatos com validação inteligente (endpoint público para testes)
   * @access Public
   */
  @Post('import-contacts')
  @UseInterceptors(FileInterceptor('file'))
  async importContactsTest(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    console.log('📁 Arquivo recebido:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer_length: file.buffer?.length
    });

    // Para testes, usar a primeira organização e usuário disponíveis
    const organization = await this.prisma.organization.findFirst();
    if (!organization) {
      return { error: 'Nenhuma organização encontrada para teste' };
    }

    const user = await this.prisma.user.findFirst({
      where: { organizationId: organization.id }
    });
    if (!user) {
      return { error: 'Nenhum usuário encontrado para teste' };
    }

    try {
      console.log('🔍 Iniciando parse do arquivo...');
      
      // Parse do arquivo Excel
      const contacts = await this.contactsService.parseExcelFile(file.buffer);
      
      console.log(`📊 ${contacts.length} contatos encontrados no arquivo`);
      
      // Importação com validação inteligente
      const importDto: ImportContactsDto = { contacts };
      const result = await this.contactsService.importContacts(
        importDto, 
        user.id, 
        organization.id
      );

      console.log('✅ Importação concluída');
      return result;
    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      throw new BadRequestException(`Erro ao processar arquivo: ${error.message}`);
    }
  }
}

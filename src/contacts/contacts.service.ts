import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { ExportContactsDto } from './dto/export-contacts.dto';
import { ImportContactsDto } from './dto/import-contacts.dto';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService,
  ) {}

  async create(createContactDto: CreateContactDto, userId: string, organizationId: string) {
    const { tagIds, ...contactData } = createContactDto;

    // Validar número WhatsApp se fornecido
    if (contactData.phone) {
      const validation = await this.whatsappService.validateWhatsAppNumber(
        contactData.phone, 
        organizationId
      );

      if (!validation.isValid) {
        throw new BadRequestException({
          message: 'Número WhatsApp inválido',
          error: validation.error,
          field: 'phone'
        });
      }

      // Usar o número formatado
      contactData.phone = validation.formattedNumber;

      // Verificar se já existe um contato com este telefone na organização
      const existingContact = await this.prisma.contact.findFirst({
        where: {
          phone: contactData.phone,
          organizationId,
        },
      });

      if (existingContact) {
        throw new ConflictException('Já existe um contato com este telefone');
      }
    }

    // Criar o contato
    const contact = await this.prisma.contact.create({
      data: {
        ...contactData,
        organizationId,
        createdById: userId,
        birthDate: contactData.birthDate ? new Date(contactData.birthDate) : null,
      },
      include: {
        contactTags: {
          include: {
            tag: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Associar tags se fornecidas
    if (tagIds && tagIds.length > 0) {
      await this.addTagsToContact(contact.id, tagIds, organizationId);
    }

    return this.findOne(contact.id, organizationId);
  }

  async findAll(queryDto: QueryContactsDto, organizationId: string) {
    const {
      search,
      tagId,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (tagId) {
      where.contactTags = {
        some: {
          tagId,
        },
      };
    }

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: {
          contactTags: {
            include: {
              tag: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data: contacts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        contactTags: {
          include: {
            tag: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          take: 10,
          orderBy: {
            timestamp: 'desc',
          },
          include: {
            session: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contato não encontrado');
    }

    return contact;
  }

  async update(id: string, updateContactDto: UpdateContactDto, organizationId: string) {
    const { tagIds, ...contactData } = updateContactDto;

    // Verificar se o contato existe
    const existingContact = await this.findOne(id, organizationId);

    // Verificar se já existe outro contato com este telefone
    if (contactData.phone && contactData.phone !== existingContact.phone) {
      // Validar se o número existe no WhatsApp
      const validation = await this.whatsappService.validateWhatsAppNumber(contactData.phone, organizationId);
      if (!validation.isValid) {
        throw new BadRequestException(validation.error || 'O número informado não é um número válido do WhatsApp');
      }

      const duplicateContact = await this.prisma.contact.findFirst({
        where: {
          phone: contactData.phone,
          organizationId,
          id: { not: id },
        },
      });

      if (duplicateContact) {
        throw new ConflictException('Já existe um contato com este telefone');
      }
    }

    // Atualizar o contato
    const contact = await this.prisma.contact.update({
      where: { id },
      data: {
        ...contactData,
        birthDate: contactData.birthDate ? new Date(contactData.birthDate) : undefined,
      },
    });

    // Atualizar tags se fornecidas
    if (tagIds !== undefined) {
      // Remover todas as tags atuais
      await this.prisma.contactTag.deleteMany({
        where: { contactId: id },
      });

      // Adicionar novas tags
      if (tagIds.length > 0) {
        await this.addTagsToContact(id, tagIds, organizationId);
      }
    }

    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string) {
    // Verificar se o contato existe
    await this.findOne(id, organizationId);

    // Deletar o contato
    await this.prisma.contact.delete({
      where: { id },
    });

    return { message: 'Contato removido com sucesso' };
  }

  async addTagsToContact(contactId: string, tagIds: string[], organizationId: string) {
    // Verificar se todas as tags existem na organização
    const tags = await this.prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        organizationId,
      },
    });

    if (tags.length !== tagIds.length) {
      throw new BadRequestException('Uma ou mais tags não foram encontradas');
    }

    // Criar as associações
    await this.prisma.contactTag.createMany({
      data: tagIds.map(tagId => ({
        contactId,
        tagId,
      })),
      skipDuplicates: true,
    });
  }

  async removeTagFromContact(contactId: string, tagId: string, organizationId: string) {
    // Verificar se o contato existe
    await this.findOne(contactId, organizationId);

    await this.prisma.contactTag.deleteMany({
      where: {
        contactId,
        tagId,
      },
    });

    return { message: 'Tag removida do contato com sucesso' };
  }

  async importContacts(importDto: ImportContactsDto, userId: string, organizationId: string) {
    const { contacts } = importDto;
    const results: {
      success: number;
      errors: Array<{
        line: number;
        contact: CreateContactDto;
        error: string;
        originalPhone?: string;
        suggestedPhone?: string;
      }>;
      duplicates: number;
      phoneValidations: Array<{
        line: number;
        originalPhone: string;
        validatedPhone?: string;
        status: 'valid' | 'corrected' | 'invalid';
        testedNumbers?: string[];
        error?: string;
      }>;
    } = {
      success: 0,
      errors: [],
      duplicates: 0,
      phoneValidations: [],
    };

    console.log(`\n🔍 Iniciando importação inteligente de ${contacts.length} contatos...`);

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const lineNumber = i + 1;

      try {
        // Se o contato tem telefone, aplicar validação inteligente
        if (contact.phone) {
          const originalPhone = contact.phone;
          console.log(`\n📱 Linha ${lineNumber}: Validando ${originalPhone}...`);

          const validation = await this.whatsappService.validateWhatsAppNumber(
            originalPhone, 
            organizationId
          );

          if (validation.isValid) {
            const wasModified = validation.formattedNumber !== originalPhone.replace(/\D/g, '');
            
            results.phoneValidations.push({
              line: lineNumber,
              originalPhone,
              validatedPhone: validation.formattedNumber,
              status: wasModified ? 'corrected' : 'valid',
              testedNumbers: validation.testedNumbers,
            });

            // Usar o número validado
            contact.phone = validation.formattedNumber;

            if (wasModified) {
              console.log(`✅ Linha ${lineNumber}: Número corrigido ${originalPhone} → ${validation.formattedNumber}`);
            } else {
              console.log(`✅ Linha ${lineNumber}: Número válido ${validation.formattedNumber}`);
            }
          } else {
            results.phoneValidations.push({
              line: lineNumber,
              originalPhone,
              status: 'invalid',
              testedNumbers: validation.testedNumbers,
              error: validation.error,
            });

            console.log(`❌ Linha ${lineNumber}: Número inválido ${originalPhone} - ${validation.error}`);
            
            // Adicionar aos erros mas continuar processamento
            results.errors.push({
              line: lineNumber,
              contact,
              error: `Número WhatsApp inválido: ${validation.error}`,
              originalPhone,
            });
            continue;
          }
        }

        // Tentar criar o contato
        await this.create(contact, userId, organizationId);
        results.success++;
        console.log(`✅ Linha ${lineNumber}: Contato criado com sucesso - ${contact.name}`);

      } catch (error) {
        if (error instanceof ConflictException) {
          results.duplicates++;
          console.log(`⚠️ Linha ${lineNumber}: Contato duplicado - ${contact.name}`);
        } else {
          results.errors.push({
            line: lineNumber,
            contact,
            error: error.message,
            originalPhone: contact.phone,
          });
          console.log(`❌ Linha ${lineNumber}: Erro - ${error.message}`);
        }
      }
    }

    // Log final do resultado
    console.log(`\n📊 Importação concluída:`);
    console.log(`   ✅ Sucessos: ${results.success}`);
    console.log(`   ⚠️ Duplicados: ${results.duplicates}`);
    console.log(`   ❌ Erros: ${results.errors.length}`);
    console.log(`   📱 Números corrigidos: ${results.phoneValidations.filter(p => p.status === 'corrected').length}`);
    console.log(`   📱 Números inválidos: ${results.phoneValidations.filter(p => p.status === 'invalid').length}`);

    return results;
  }

  async exportContacts(exportDto: ExportContactsDto, organizationId: string) {
    const { format = 'xlsx', fields, contactIds, tagId, search } = exportDto;

    const where: any = {
      organizationId,
    };

    if (contactIds && contactIds.length > 0) {
      where.id = { in: contactIds };
    }

    if (tagId) {
      where.contactTags = {
        some: { tagId },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const contacts = await this.prisma.contact.findMany({
      where,
      include: {
        contactTags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contatos');

    // Definir colunas
    const columns = [
      { header: 'Nome', key: 'name', width: 20 },
      { header: 'Telefone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Documento', key: 'document', width: 15 },
      { header: 'Data de Nascimento', key: 'birthDate', width: 18 },
      { header: 'Endereço', key: 'address', width: 30 },
      { header: 'Cidade', key: 'city', width: 15 },
      { header: 'Estado', key: 'state', width: 10 },
      { header: 'CEP', key: 'zipCode', width: 10 },
      { header: 'Observações', key: 'notes', width: 30 },
      { header: 'Tags', key: 'tags', width: 20 },
      { header: 'Ativo', key: 'isActive', width: 10 },
      { header: 'Data de Criação', key: 'createdAt', width: 18 },
    ];

    // Filtrar colunas se especificado
    const finalColumns = fields ? columns.filter(col => fields.includes(col.key)) : columns;
    worksheet.columns = finalColumns;

    // Adicionar dados
    contacts.forEach(contact => {
      const rowData: any = {
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        document: contact.document,
        birthDate: contact.birthDate ? contact.birthDate.toLocaleDateString('pt-BR') : '',
        address: contact.address,
        city: contact.city,
        state: contact.state,
        zipCode: contact.zipCode,
        notes: contact.notes,
        tags: contact.contactTags.map(ct => ct.tag.name).join(', '),
        isActive: contact.isActive ? 'Sim' : 'Não',
        createdAt: contact.createdAt.toLocaleDateString('pt-BR'),
      };

      // Filtrar dados se campos específicos foram solicitados
      const finalRowData = fields ? 
        Object.fromEntries(Object.entries(rowData).filter(([key]) => fields.includes(key))) : 
        rowData;

      worksheet.addRow(finalRowData);
    });

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' },
    };

    // Gerar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async getImportTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template Contatos');

    // Definir colunas do template
    worksheet.columns = [
      { header: 'Nome*', key: 'name', width: 20 },
      { header: 'Telefone', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Documento', key: 'document', width: 15 },
      { header: 'Data de Nascimento (DD/MM/AAAA)', key: 'birthDate', width: 25 },
      { header: 'Endereço', key: 'address', width: 30 },
      { header: 'Cidade', key: 'city', width: 15 },
      { header: 'Estado', key: 'state', width: 10 },
      { header: 'CEP', key: 'zipCode', width: 10 },
      { header: 'Observações', key: 'notes', width: 30 },
      { header: 'Ativo (true/false)', key: 'isActive', width: 15 },
    ];

    // Adicionar linha de exemplo
    worksheet.addRow({
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@email.com',
      document: '123.456.789-00',
      birthDate: '01/01/1990',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      notes: 'Cliente VIP',
      isActive: 'true',
    });

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' },
    };

    // Adicionar instruções em uma nova aba
    const instructionsSheet = workbook.addWorksheet('Instruções');
    instructionsSheet.addRow(['INSTRUÇÕES PARA IMPORTAÇÃO DE CONTATOS']);
    instructionsSheet.addRow(['']);
    instructionsSheet.addRow(['1. Preencha os dados na aba "Template Contatos"']);
    instructionsSheet.addRow(['2. Campos marcados com * são obrigatórios']);
    instructionsSheet.addRow(['3. Formato de data: DD/MM/AAAA']);
    instructionsSheet.addRow(['4. Campo "Ativo": use "true" ou "false"']);
    instructionsSheet.addRow(['5. Telefone deve conter apenas números']);
    instructionsSheet.addRow(['6. Email deve ter formato válido']);
    instructionsSheet.addRow(['']);
    instructionsSheet.addRow(['CAMPOS DISPONÍVEIS:']);
    instructionsSheet.addRow(['- Nome: Nome completo do contato (obrigatório)']);
    instructionsSheet.addRow(['- Telefone: Número de telefone com DDD']);
    instructionsSheet.addRow(['- Email: Endereço de email válido']);
    instructionsSheet.addRow(['- Documento: CPF ou CNPJ']);
    instructionsSheet.addRow(['- Data de Nascimento: No formato DD/MM/AAAA']);
    instructionsSheet.addRow(['- Endereço: Endereço completo']);
    instructionsSheet.addRow(['- Cidade: Nome da cidade']);
    instructionsSheet.addRow(['- Estado: Sigla do estado (SP, RJ, etc.)']);
    instructionsSheet.addRow(['- CEP: Código postal']);
    instructionsSheet.addRow(['- Observações: Informações adicionais']);
    instructionsSheet.addRow(['- Ativo: Status do contato (true/false)']);

    instructionsSheet.getRow(1).font = { bold: true, size: 14 };
    instructionsSheet.getColumn(1).width = 50;

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async parseExcelFile(fileBuffer: Buffer): Promise<CreateContactDto[]> {
    try {
      console.log('🔍 Iniciando parse do arquivo Excel...');
      console.log('📊 Tamanho do buffer:', fileBuffer.length);
      
      const workbook = new ExcelJS.Workbook();
      
      // Tentar carregar o arquivo
      await workbook.xlsx.load(fileBuffer as any);
      console.log('✅ Arquivo Excel carregado com sucesso');
      
      const worksheet = workbook.getWorksheet(1) || workbook.getWorksheet('Contatos');
      if (!worksheet) {
        throw new BadRequestException('Planilha não encontrada. Certifique-se de que existe uma planilha chamada "Contatos" ou use a primeira aba.');
      }

      console.log('📋 Planilha encontrada:', worksheet.name);
      console.log('📏 Número de linhas:', worksheet.rowCount);

      const contacts: CreateContactDto[] = [];
      const headers: string[] = [];

      // Ler cabeçalhos
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value?.toString().toLowerCase() || '';
      });

      console.log('📝 Cabeçalhos encontrados:', headers.filter(h => h));

      // Mapear colunas
      const columnMap: { [key: string]: number } = {};
      headers.forEach((header, index) => {
        if (header.includes('nome')) columnMap.name = index;
        if (header.includes('telefone')) columnMap.phone = index;
        if (header.includes('email')) columnMap.email = index;
        if (header.includes('documento')) columnMap.document = index;
        if (header.includes('nascimento') || header.includes('data')) columnMap.birthDate = index;
        if (header.includes('endereço')) columnMap.address = index;
        if (header.includes('cidade')) columnMap.city = index;
        if (header.includes('estado')) columnMap.state = index;
        if (header.includes('cep')) columnMap.zipCode = index;
        if (header.includes('observ') || header.includes('nota')) columnMap.notes = index;
        if (header.includes('ativo')) columnMap.isActive = index;
      });

      console.log('🗺️ Mapeamento de colunas:', columnMap);

      // Processar linhas de dados
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Pular cabeçalho

        const contact: any = {};
        
        if (columnMap.name) {
          const nameValue = row.getCell(columnMap.name).value;
          contact.name = nameValue?.toString().trim();
        }

        if (columnMap.phone) {
          const phoneValue = row.getCell(columnMap.phone).value;
          if (phoneValue) {
            contact.phone = phoneValue.toString().replace(/\D/g, '');
          }
        }

        if (columnMap.email) {
          const emailValue = row.getCell(columnMap.email).value;
          if (emailValue) {
            contact.email = emailValue.toString().trim();
          }
        }

        if (columnMap.document) {
          const docValue = row.getCell(columnMap.document).value;
          if (docValue) {
            contact.document = docValue.toString().trim();
          }
        }

        if (columnMap.birthDate) {
          const dateValue = row.getCell(columnMap.birthDate).value;
          if (dateValue) {
            if (dateValue instanceof Date) {
              contact.birthDate = dateValue.toISOString().split('T')[0];
            } else {
              // Tentar converter string de data DD/MM/AAAA
              const dateStr = dateValue.toString();
              const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
              if (dateMatch) {
                const [, day, month, year] = dateMatch;
                contact.birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
            }
          }
        }

        if (columnMap.address) {
          const addressValue = row.getCell(columnMap.address).value;
          if (addressValue) {
            contact.address = addressValue.toString().trim();
          }
        }

        if (columnMap.city) {
          const cityValue = row.getCell(columnMap.city).value;
          if (cityValue) {
            contact.city = cityValue.toString().trim();
          }
        }

        if (columnMap.state) {
          const stateValue = row.getCell(columnMap.state).value;
          if (stateValue) {
            contact.state = stateValue.toString().trim();
          }
        }

        if (columnMap.zipCode) {
          const zipValue = row.getCell(columnMap.zipCode).value;
          if (zipValue) {
            contact.zipCode = zipValue.toString().replace(/\D/g, '');
          }
        }

        if (columnMap.notes) {
          const notesValue = row.getCell(columnMap.notes).value;
          if (notesValue) {
            contact.notes = notesValue.toString().trim();
          }
        }

        if (columnMap.isActive) {
          const activeValue = row.getCell(columnMap.isActive).value;
          if (activeValue) {
            const activeStr = activeValue.toString().toLowerCase();
            contact.isActive = activeStr === 'true' || activeStr === '1' || activeStr === 'sim';
          }
        }

        // Adicionar apenas se tem nome (campo obrigatório)
        if (contact.name && contact.name.trim() !== '') {
          contacts.push(contact);
          console.log(`📝 Linha ${rowNumber}: ${contact.name} - ${contact.phone || 'sem telefone'}`);
        }
      });

      console.log(`✅ Parse concluído: ${contacts.length} contatos válidos encontrados`);
      return contacts;
      
    } catch (error) {
      console.error('❌ Erro no parse do Excel:', error);
      throw new BadRequestException(`Erro ao processar arquivo Excel: ${error.message}`);
    }
  }

  /**
   * Valida um número de WhatsApp standalone (sem salvar contato)
   */
  async validatePhoneNumber(phone: string, organizationId: string) {
    return await this.whatsappService.validateWhatsAppNumber(phone, organizationId);
  }
}

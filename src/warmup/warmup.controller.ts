import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  CanCreateWarmupCampaigns,
  CanReadWarmupCampaigns,
  CanUpdateWarmupCampaigns,
  CanDeleteWarmupCampaigns,
} from '../auth/decorators/permissions.decorator';
import { WarmupService } from './warmup.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWarmupCampaignDto,
  UpdateWarmupCampaignDto,
  CreateMessageTemplateDto,
  CreateTemplateWithFileDto,
  AddContactsToCampaignDto,
  AddSessionsToCampaignDto,
  ImportTemplatesDto,
  UpdateAutoReadSettingsDto,
} from './dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('warmup')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WarmupController {
  constructor(
    private readonly warmupService: WarmupService,
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  // CRUD das Campanhas
  @Post('campaigns')
  @CanCreateWarmupCampaigns()
  create(@Body() createCampaignDto: CreateWarmupCampaignDto, @Request() req) {
    return this.warmupService.createCampaign(
      createCampaignDto,
      req.user.id,
      req.user.organizationId,
    );
  }

  @Get('campaigns')
  @CanReadWarmupCampaigns()
  findAll(@Request() req) {
    return this.warmupService.findAll(req.user.organizationId);
  }

  @Get('campaigns/:id')
  @CanReadWarmupCampaigns()
  findOne(@Param('id') id: string, @Request() req) {
    return this.warmupService.findOne(id, req.user.organizationId);
  }

  @Patch('campaigns/:id')
  @CanUpdateWarmupCampaigns()
  update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateWarmupCampaignDto,
    @Request() req,
  ) {
    return this.warmupService.update(id, updateCampaignDto, req.user.organizationId);
  }

  @Delete('campaigns/:id')
  @CanDeleteWarmupCampaigns()
  remove(@Param('id') id: string, @Request() req) {
    return this.warmupService.remove(id, req.user.organizationId);
  }

  // Gerenciamento de Sessões
  @Post('campaigns/:id/sessions')
  @CanUpdateWarmupCampaigns()
  addSessions(
    @Param('id') id: string,
    @Body() addSessionsDto: AddSessionsToCampaignDto,
    @Request() req,
  ) {
    return this.warmupService.addSessionsToCampaign(
      id,
      addSessionsDto,
      req.user.organizationId,
    );
  }

  @Delete('campaigns/:id/sessions/:sessionId')
  @CanUpdateWarmupCampaigns()
  removeSession(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    return this.warmupService.removeSessionFromCampaign(
      id,
      sessionId,
      req.user.organizationId,
    );
  }

  // Gerenciamento de Contatos
  @Post('campaigns/:id/contacts')
  @CanUpdateWarmupCampaigns()
  addContacts(
    @Param('id') id: string,
    @Body() addContactsDto: AddContactsToCampaignDto,
    @Request() req,
  ) {
    return this.warmupService.addContactsToCampaign(
      id,
      addContactsDto,
      req.user.organizationId,
    );
  }

  @Delete('campaigns/:id/contacts/:contactId')
  @CanUpdateWarmupCampaigns()
  removeContact(
    @Param('id') id: string,
    @Param('contactId') contactId: string,
    @Request() req,
  ) {
    return this.warmupService.removeContactFromCampaign(
      id,
      contactId,
      req.user.organizationId,
    );
  }

  // Templates de Mensagem
  @Post('campaigns/:id/templates')
  @CanUpdateWarmupCampaigns()
  createTemplate(
    @Param('id') id: string,
    @Body() createTemplateDto: CreateMessageTemplateDto,
    @Request() req,
  ) {
    return this.warmupService.createMessageTemplate(
      id,
      createTemplateDto,
      req.user.organizationId,
    );
  }

  @Patch('campaigns/:id/templates/:templateId')
  @CanUpdateWarmupCampaigns()
  updateTemplate(
    @Param('id') id: string,
    @Param('templateId') templateId: string,
    @Body() updateTemplateDto: Partial<CreateMessageTemplateDto>,
    @Request() req,
  ) {
    return this.warmupService.updateMessageTemplate(
      id,
      templateId,
      updateTemplateDto,
      req.user.organizationId,
    );
  }

  @Delete('campaigns/:id/templates/:templateId')
  @CanUpdateWarmupCampaigns()
  deleteTemplate(
    @Param('id') id: string,
    @Param('templateId') templateId: string,
    @Request() req,
  ) {
    return this.warmupService.deleteMessageTemplate(
      id,
      templateId,
      req.user.organizationId,
    );
  }

  // Upload de Arquivos de Mídia
  @Post('campaigns/:id/media')
  @CanUpdateWarmupCampaigns()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/warmup',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'audio/mpeg',
          'audio/wav',
          'audio/ogg',
          'video/mp4',
          'video/avi',
          'video/mov',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de arquivo não suportado'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadMedia(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    // Determinar tipo do arquivo
    let fileType = 'document';
    if (file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (file.mimetype.startsWith('audio/')) {
      fileType = 'audio';
    } else if (file.mimetype.startsWith('video/')) {
      fileType = 'video';
    }

    // Salvar no banco
    const mediaFile = await this.prisma.warmupMediaFile.create({
      data: {
        campaignId: id,
        fileName: file.originalname,
        filePath: file.path,
        fileType,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    return mediaFile;
  }

  // Criar template com arquivo
  @Post('campaigns/:id/templates/with-file')
  @CanUpdateWarmupCampaigns()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/warmup',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'audio/mpeg',
          'audio/wav',
          'audio/ogg',
          'video/mp4',
          'video/avi',
          'video/mov',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Tipo de arquivo não suportado'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async createTemplateWithFile(
    @Param('id') campaignId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() templateDto: { content?: string; weight?: string; variables?: string },
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    const createTemplateWithFileDto = {
      content: templateDto.content || '',
      fileType: file.mimetype.startsWith('image/') ? 'image' :
                file.mimetype.startsWith('audio/') ? 'audio' :
                file.mimetype.startsWith('video/') ? 'video' : 'document',
      weight: templateDto.weight ? parseInt(templateDto.weight) : 1,
      variables: templateDto.variables ? JSON.parse(templateDto.variables) : {},
    };

    return this.warmupService.createTemplateWithFile(
      campaignId,
      file,
      createTemplateWithFileDto,
      req.user.organizationId,
    );
  }

  // Listar arquivos de mídia de uma campanha
  @Get('campaigns/:id/media')
  @CanReadWarmupCampaigns()
  getMediaFiles(@Param('id') id: string, @Request() req) {
    return this.warmupService.getMediaFiles(id, req.user.organizationId);
  }

  // Deletar arquivo de mídia
  @Delete('campaigns/:id/media/:mediaId')
  @CanUpdateWarmupCampaigns()
  deleteMediaFile(
    @Param('id') campaignId: string,
    @Param('mediaId') mediaId: string,
    @Request() req,
  ) {
    return this.warmupService.deleteMediaFile(campaignId, mediaId, req.user.organizationId);
  }

  // Estatísticas
  @Get('campaigns/:id/stats')
  @CanReadWarmupCampaigns()
  getStats(@Param('id') id: string, @Request() req) {
    return this.warmupService.getCampaignStats(id, req.user.organizationId);
  }

  // Saúde dos Números
  @Post('campaigns/:id/sessions/:sessionId/health')
  @CanReadWarmupCampaigns()
  async calculateHealth(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    // Verificar se a sessão pertence à campanha
    const campaignSession = await this.prisma.warmupCampaignSession.findFirst({
      where: {
        campaignId: id,
        sessionId,
        campaign: {
          organizationId: req.user.organizationId,
        },
      },
    });

    if (!campaignSession) {
      throw new BadRequestException('Sessão não encontrada na campanha');
    }

    const healthScore = await this.warmupService.calculateHealthScore(campaignSession.id);

    return {
      campaignSessionId: campaignSession.id,
      sessionId,
      healthScore,
      calculatedAt: new Date(),
    };
  }

  // Dashboard de Monitoramento
  @Get('dashboard')
  @CanReadWarmupCampaigns()
  getDashboard(@Request() req) {
    return this.warmupService.getDashboard(req.user.organizationId);
  }

  // Recalcular saúde de todas as sessões de uma campanha
  @Post('campaigns/:id/recalculate-health')
  @CanUpdateWarmupCampaigns()
  async recalculateHealth(@Param('id') id: string, @Request() req) {
    // Buscar todas as sessões da campanha
    const campaign = await this.prisma.warmupCampaign.findUnique({
      where: {
        id,
        organizationId: req.user.organizationId,
      },
      include: {
        campaignSessions: {
          include: {
            session: {
              select: { name: true, phone: true }
            }
          }
        }
      }
    });

    if (!campaign) {
      throw new BadRequestException('Campanha não encontrada');
    }

    const results: Array<{
      campaignSessionId: string;
      sessionId: string;
      sessionName: string;
      healthScore: number;
      deliveryRate?: number;
      totalExecutions?: number;
      sentExecutions?: number;
      failedExecutions?: number;
    }> = [];
    
    for (const campaignSession of campaign.campaignSessions) {
      const healthScore = await this.warmupService.calculateHealthScore(campaignSession.id);
      
      // Calcular estatísticas de entrega específicas
      const deliveryStats = await this.warmupService.getDeliveryStats(campaignSession.sessionId);
      
      results.push({
        campaignSessionId: campaignSession.id,
        sessionId: campaignSession.sessionId,
        sessionName: campaignSession.session.name || campaignSession.session.phone || 'Sessão Desconhecida',
        healthScore,
        deliveryRate: deliveryStats.deliveryRate,
        totalExecutions: deliveryStats.totalExecutions,
        sentExecutions: deliveryStats.sentExecutions,
        failedExecutions: deliveryStats.failedExecutions,
      });
    }

    return {
      message: 'Saúde recalculada para todas as sessões',
      campaignId: id,
      campaignName: campaign.name,
      results,
      calculatedAt: new Date(),
    };
  }

  // Obter estatísticas de entrega de uma sessão específica
  @Get('sessions/:sessionId/delivery-stats')
  @CanReadWarmupCampaigns()
  async getDeliveryStats(@Param('sessionId') sessionId: string, @Request() req) {
    // Verificar se a sessão pertence à organização
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        sessionId,
        organizationId: req.user.organizationId,
      },
    });

    if (!session) {
      throw new BadRequestException('Sessão não encontrada');
    }

    const stats = await this.warmupService.getDeliveryStats(sessionId);
    
    return {
      sessionId,
      sessionName: session.name || session.phone,
      ...stats,
      calculatedAt: new Date(),
    };
  }

  // Relatório de Saúde das Campanhas
  @Get('health-report')
  @CanReadWarmupCampaigns()
  getHealthReport(@Request() req, @Query('organizationId') organizationId?: string) {
    // Se um organizationId for fornecido e o usuário for super admin, usar esse ID
    // Caso contrário, usar o organizationId do usuário logado
    const targetOrgId = organizationId && req.user.isSuperAdmin 
      ? organizationId 
      : req.user.organizationId;
    
    return this.warmupService.getHealthReport(targetOrgId);
  }

  // Controles da Campanha
  @Post('campaigns/:id/pause')
  @CanUpdateWarmupCampaigns()
  pauseCampaign(@Param('id') id: string, @Request() req) {
    return this.warmupService.pauseCampaign(id, req.user.organizationId);
  }

  @Post('campaigns/:id/resume')
  @CanUpdateWarmupCampaigns()
  resumeCampaign(@Param('id') id: string, @Request() req) {
    return this.warmupService.resumeCampaign(id, req.user.organizationId);
  }

  @Post('campaigns/:id/execute')
  @CanUpdateWarmupCampaigns()
  forceExecution(
    @Param('id') id: string,
    @Body() data: {
      executionType: 'internal' | 'external';
      fromSessionId: string;
      contactId?: string;
      toSessionId?: string;
      templateId?: string;
    },
    @Request() req,
  ) {
    return this.warmupService.forceExecution(id, data, req.user.organizationId);
  }

  // Estatísticas da Campanha (alias para compatibilidade)
  @Get('campaigns/:id/statistics')
  @CanReadWarmupCampaigns()
  getCampaignStatistics(
    @Param('id') id: string,
    @Request() req,
    @Query('period') period?: string,
  ) {
    return this.warmupService.getCampaignStatistics(id, req.user.organizationId, period);
  }

  // ===== FUNCIONALIDADES FALTANTES =====

  // 6. Listar Sessões da Campanha
  @Get('campaigns/:campaignId/sessions')
  @CanReadWarmupCampaigns()
  async getCampaignSessions(
    @Param('campaignId') campaignId: string,
    @Request() req,
    @Query('status') status?: string,
  ) {
    return this.warmupService.getCampaignSessions(campaignId, req.user.organizationId, status);
  }

  // 9. Estatísticas de Conversas Internas
  @Get('campaigns/:campaignId/internal-conversations')
  @CanReadWarmupCampaigns()
  async getInternalConversations(
    @Param('campaignId') campaignId: string,
    @Request() req,
    @Query('period') period?: string,
  ) {
    return this.warmupService.getInternalConversationsStats(campaignId, req.user.organizationId, period);
  }

  // 10. Forçar Conversa Interna
  @Post('campaigns/:campaignId/internal-conversations/execute')
  @CanUpdateWarmupCampaigns()
  async forceInternalConversation(
    @Param('campaignId') campaignId: string,
    @Body() data: {
      fromSessionId: string;
      toSessionId: string;
      templateId?: string;
    },
    @Request() req,
  ) {
    return this.warmupService.forceInternalConversation(campaignId, data, req.user.organizationId);
  }

  // 11. Listar Templates
  @Get('campaigns/:campaignId/templates')
  @CanReadWarmupCampaigns()
  async getTemplates(
    @Param('campaignId') campaignId: string,
    @Request() req,
    @Query('type') type?: string,
    @Query('active') active?: boolean,
  ) {
    return this.warmupService.getCampaignTemplates(campaignId, req.user.organizationId, { type, active });
  }

  // 13. Listar Contatos da Campanha
  @Get('campaigns/:campaignId/contacts')
  @CanReadWarmupCampaigns()
  async getCampaignContacts(
    @Param('campaignId') campaignId: string,
    @Request() req,
  ) {
    return this.warmupService.getCampaignContacts(campaignId, req.user.organizationId);
  }

  // 16. Histórico de Execuções
  @Get('campaigns/:campaignId/executions')
  @CanReadWarmupCampaigns()
  async getExecutions(
    @Param('campaignId') campaignId: string,
    @Request() req,
    @Query('status') status?: string,
    @Query('executionType') executionType?: string,
    @Query('fromSessionId') fromSessionId?: string,
    @Query('toSessionId') toSessionId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.warmupService.getExecutionHistory(campaignId, req.user.organizationId, {
      status,
      executionType,
      fromSessionId,
      toSessionId,
      startDate,
      endDate,
      page: page || 1,
      limit: limit || 10,
    });
  }

  // 17. Importar Templates/Mensagens em JSON
  @Post('campaigns/:campaignId/templates/import')
  @CanUpdateWarmupCampaigns()
  async importTemplates(
    @Param('campaignId') campaignId: string,
    @Body() importData: ImportTemplatesDto,
    @Request() req,
  ) {
    return this.warmupService.importTemplates(campaignId, importData, req.user.organizationId);
  }

  // 18. Teste de Pausas Automáticas
  @Post('campaigns/:campaignId/test-auto-pause')
  @CanUpdateWarmupCampaigns()
  async testAutoPause(
    @Param('campaignId') campaignId: string,
    @Body() data: {
      enableAutoPauses: boolean;
      maxPauseTimeMinutes: number;
      minConversationTimeMinutes: number;
    },
    @Request() req,
  ) {
    return this.warmupService.testAutoPause(campaignId, data, req.user.organizationId);
  }

  // 15. Resumo das Últimas Mensagens Enviadas pela Sessão de Aquecimento
  @Get('sessions/:sessionId/recent-messages')
  @CanReadWarmupCampaigns()
  async getSessionRecentMessages(
    @Param('sessionId') sessionId: string,
    @Request() req,
    @Query('limit') limit?: string,
    @Query('type') type?: 'all' | 'internal' | 'external',
  ) {
    const messageLimit = limit ? parseInt(limit) : 20;
    const messageType = type || 'all';
    return this.warmupService.getSessionRecentMessages(sessionId, req.user.organizationId, messageLimit, messageType);
  }

  // 16. Marcar Mensagens como Lidas para uma Sessão
  @Post('sessions/:sessionId/mark-as-read')
  @CanUpdateWarmupCampaigns()
  async markSessionMessagesAsRead(
    @Param('sessionId') sessionId: string,
    @Request() req,
    @Body() body?: { chatId?: string },
  ) {
    return this.warmupService.markSessionMessagesAsRead(sessionId, req.user.organizationId, body?.chatId);
  }

  // 17. Obter Conversas Não Lidas de uma Sessão
  @Get('sessions/:sessionId/unread-conversations')
  @CanReadWarmupCampaigns()
  async getSessionUnreadConversations(
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    return this.warmupService.getSessionUnreadConversations(sessionId, req.user.organizationId);
  }

  // 18. Obter Configurações de Auto-Read de uma Sessão de Aquecimento
  @Get('campaigns/:campaignId/sessions/:sessionId/auto-read-settings')
  @CanReadWarmupCampaigns()
  async getWarmupSessionAutoReadSettings(
    @Param('campaignId') campaignId: string,
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    return this.warmupService.getWarmupSessionAutoReadSettings(campaignId, sessionId, req.user.organizationId);
  }

  // 19. Atualizar Configurações de Auto-Read de uma Sessão de Aquecimento
  @Patch('campaigns/:campaignId/sessions/:sessionId/auto-read-settings')
  @CanUpdateWarmupCampaigns()
  async updateWarmupSessionAutoReadSettings(
    @Param('campaignId') campaignId: string,
    @Param('sessionId') sessionId: string,
    @Body() updateAutoReadSettingsDto: UpdateAutoReadSettingsDto,
    @Request() req,
  ) {
    return this.warmupService.updateWarmupSessionAutoReadSettings(campaignId, sessionId, req.user.organizationId, updateAutoReadSettingsDto);
  }

  // 20. Toggle Auto-Read para uma Sessão de Aquecimento
  @Post('campaigns/:campaignId/sessions/:sessionId/auto-read/toggle')
  @CanUpdateWarmupCampaigns()
  async toggleWarmupSessionAutoRead(
    @Param('campaignId') campaignId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: { enabled: boolean },
    @Request() req,
  ) {
    return this.warmupService.toggleWarmupSessionAutoRead(campaignId, sessionId, req.user.organizationId, body.enabled);
  }

  // 21. Ativar Auto-Read para uma Sessão de Aquecimento
  @Post('campaigns/:campaignId/sessions/:sessionId/auto-read/enable')
  @CanUpdateWarmupCampaigns()
  async enableWarmupSessionAutoRead(
    @Param('campaignId') campaignId: string,
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    return this.warmupService.toggleWarmupSessionAutoRead(campaignId, sessionId, req.user.organizationId, true);
  }

  // 22. Desativar Auto-Read para uma Sessão de Aquecimento
  @Post('campaigns/:campaignId/sessions/:sessionId/auto-read/disable')
  @CanUpdateWarmupCampaigns()
  async disableWarmupSessionAutoRead(
    @Param('campaignId') campaignId: string,
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    return this.warmupService.toggleWarmupSessionAutoRead(campaignId, sessionId, req.user.organizationId, false);
  }

  // 23. Obter Status do Auto-Read por Campanha
  @Get('campaigns/:campaignId/auto-read-status')
  @CanReadWarmupCampaigns()
  async getCampaignAutoReadStatus(
    @Param('campaignId') campaignId: string,
    @Request() req,
  ) {
    return this.warmupService.getCampaignAutoReadStatus(campaignId, req.user.organizationId);
  }

  // 24. Endpoint de Teste para Chat Específico
  @Post('test-read-chat/:sessionId')
  @CanUpdateWarmupCampaigns()
  async testReadSpecificChat(
    @Param('sessionId') sessionId: string,
    @Body() body: { chatId: string },
    @Request() req,
  ) {
    return this.whatsappService.markMessagesAsRead(sessionId, req.user.organizationId, body.chatId);
  }

  // 25. Endpoint de Teste para Todos os Chats (auto-read completo)
  @Post('test-auto-read-all/:sessionId')
  @CanUpdateWarmupCampaigns()
  async testAutoReadAll(@Param('sessionId') sessionId: string, @Request() req) {
    const organizationId = req.user.organizationId;
    
    try {
      console.log(`🧪 TESTE MANUAL: Iniciando auto-read para sessão ${sessionId}`);
      
      // Buscar todos os chats ativos
      const allChats = await this.whatsappService.getAllActiveChats(sessionId, organizationId);
      console.log(`📱 Encontrados ${allChats.length} chats ativos para teste`);
      
      if (allChats.length === 0) {
        return {
          success: false,
          message: 'Nenhum chat ativo encontrado',
          chats: []
        };
      }
      
      const results: Array<{
        chatId: string;
        unreadCount: number;
        success: boolean;
        message: string;
      }> = [];
      
      // Processar cada chat com delay de 2 segundos
      for (let i = 0; i < allChats.length; i++) {
        const chat = allChats[i];
        
        console.log(`🔄 [${i + 1}/${allChats.length}] Processando chat: ${chat.chatId}`);
        
        try {
          const result = await this.whatsappService.markMessagesAsRead(
            sessionId,
            organizationId,
            chat.chatId
          );
          
          results.push({
            chatId: chat.chatId,
            unreadCount: chat.unreadCount,
            success: result.success,
            message: result.message
          });
          
          console.log(`${result.success ? '✅' : '❌'} Chat ${chat.chatId}: ${result.message}`);
          
          // Delay de 2 segundos entre cada chat para não sobrecarregar
          if (i < allChats.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (chatError) {
          console.log(`❌ Erro no chat ${chat.chatId}: ${chatError.message}`);
          results.push({
            chatId: chat.chatId,
            unreadCount: chat.unreadCount,
            success: false,
            message: `Erro: ${chatError.message}`
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      console.log(`✅ TESTE CONCLUÍDO: ${successCount}/${results.length} chats processados com sucesso`);
      
      return {
        success: true,
        message: `Teste concluído: ${successCount}/${results.length} chats processados`,
        totalChats: results.length,
        successCount,
        failureCount: results.length - successCount,
        chats: results
      };
      
    } catch (error) {
      console.log(`❌ Erro durante teste de auto-read: ${error.message}`);
      return {
        success: false,
        message: `Erro durante teste: ${error.message}`,
        chats: []
      };
    }
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import {
  CreateWarmupCampaignDto,
  UpdateWarmupCampaignDto,
  CreateMessageTemplateDto,
  AddContactsToCampaignDto,
  AddSessionsToCampaignDto,
  ImportTemplatesDto,
} from './dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class WarmupService {
  private readonly logger = new Logger(WarmupService.name);

  // Função auxiliar para obter o nome da sessão de forma segura
  private getSessionName(campaignSession: any): string {
    return campaignSession?.session?.name || campaignSession?.session?.phone || 'Sessão Desconhecida';
  }

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private whatsappService: WhatsAppService,
  ) {}

  // CRUD das Campanhas
  async createCampaign(
    createCampaignDto: CreateWarmupCampaignDto,
    userId: string,
    organizationId: string,
  ) {
    // Validação básica dos parâmetros
    if (!userId) {
      throw new BadRequestException('ID do usuário é obrigatório');
    }

    if (!organizationId) {
      throw new BadRequestException('ID da organização é obrigatório');
    }

    const {
      sessionIds,
      contactIds,
      minIntervalMinutes,
      maxIntervalMinutes,
      workingHourStart,
      workingHourEnd,
      ...campaignData
    } = createCampaignDto;

    // Validações
    if (minIntervalMinutes && maxIntervalMinutes && campaignData.randomizeInterval && minIntervalMinutes >= maxIntervalMinutes) {
      throw new BadRequestException(
        'Intervalo mínimo deve ser menor que o intervalo máximo quando randomização estiver habilitada',
      );
    }

    if (workingHourStart && workingHourEnd && workingHourStart >= workingHourEnd) {
      throw new BadRequestException(
        'Horário de início deve ser menor que o horário de fim',
      );
    }

    const campaign = await this.prisma.warmupCampaign.create({
      data: {
        ...campaignData,
        minIntervalMinutes,
        maxIntervalMinutes,
        workingHourStart,
        workingHourEnd,
        organization: {
          connect: { id: organizationId }
        },
        createdBy: {
          connect: { id: userId }
        },
      },
      include: {
        campaignSessions: {
          include: {
            session: true,
          },
        },
        campaignContacts: {
          include: {
            contact: true,
          },
        },
        messageTemplates: true,
        mediaFiles: true,
      },
    });

    // Adicionar sessões se fornecidas
    if (sessionIds && sessionIds.length > 0) {
      await this.addSessionsToCampaign(campaign.id, { sessionIds }, organizationId);
    }

    // Adicionar contatos se fornecidos
    if (contactIds && contactIds.length > 0) {
      await this.addContactsToCampaign(
        campaign.id,
        { contactIds },
        organizationId,
      );
    }

    return campaign;
  }

  private async scheduleInternalConversation(
    campaign: any,
    fromSession: any,
    toSession: any,
    template: any,
    isTestMessage: boolean = false,
  ) {
    // Calcular horário de envio com randomização
    const now = new Date();
    let scheduledAt = new Date(now);

    if (isTestMessage) {
      // Para mensagens de teste, agendar para 30 segundos no futuro
      scheduledAt = new Date(now.getTime() + 30 * 1000);
    } else if (campaign.randomizeInterval) {
      const minInterval = campaign.minIntervalMinutes;
      const maxInterval = campaign.maxIntervalMinutes;
      const randomMinutes = Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval;
      scheduledAt = new Date(now.getTime() + randomMinutes * 60 * 1000);
    } else {
      // Quando randomize=false, usar intervalo randomizado de 0 a 60 segundos
      const randomSeconds = Math.floor(Math.random() * 61); // 0 a 60 segundos
      scheduledAt = new Date(now.getTime() + randomSeconds * 1000);
    }

    // Personalizar mensagem com dados da sessão de destino
    const toSessionData = {
      name: toSession.session.name || 'Colega',
      phone: toSession.session.phone || 'Número não identificado',
    };
    
    const personalizedContent = this.personalizeMessage(template.content, toSessionData);

    // Calcular horário de envio considerando pausas automáticas
    const baseScheduledAt = await this.calculateNextScheduleTime(campaign, fromSession, scheduledAt);
    
    console.log('DEBUG - Criando execução interna:');
    console.log('- Campaign ID:', campaign.id);
    console.log('- From Session ID:', fromSession.sessionId);
    console.log('- To Session ID:', toSession.sessionId);
    console.log('- Template ID:', template.id);
    console.log('- Base Scheduled At:', scheduledAt.toISOString());
    console.log('- Final Scheduled At (com pausas):', baseScheduledAt.toISOString());
    console.log('- Message Content:', personalizedContent);

    // Criar execução de conversa interna
    let execution;
    try {
      execution = await this.prisma.warmupExecution.create({
        data: {
          campaignId: campaign.id,
          fromSessionId: fromSession.sessionId,
          toSessionId: toSession.sessionId,
          templateId: template.id,
          messageContent: personalizedContent,
          messageType: template.messageType,
          executionType: 'internal',
          status: 'scheduled',
          scheduledAt: baseScheduledAt,
        },
      });

      console.log('DEBUG - Execução criada com ID:', execution.id);
      console.log('DEBUG - Status da execução:', execution.status);
      console.log('DEBUG - Scheduled At salvo:', execution.scheduledAt);
    } catch (error) {
      console.error('ERRO ao criar execução:', error);
      throw error;
    }

    // Atualizar contadores da sessão remetente
    const updatedSession = await this.prisma.warmupCampaignSession.update({
      where: { id: fromSession.id },
      data: {
        dailyMessagesSent: { increment: 1 },
        totalMessagesSent: { increment: 1 },
        lastMessageAt: baseScheduledAt,
      },
      include: {
        session: true,
      },
    });

    // Notificar execução agendada
    this.notificationsService.notifyWarmupExecution(
      campaign.organizationId,
      {
        campaignId: campaign.id,
        campaignName: campaign.name,
        sessionId: fromSession.sessionId,
        sessionName: updatedSession.session.name,
        contactId: toSession.sessionId, // Usando sessionId como contactId para conversas internas
        contactName: toSession.session.name || 'Sessão Interna',
        contactPhone: toSession.session.phone || '',
        messageContent: personalizedContent,
        messageType: template.messageType,
        status: 'scheduled',
        scheduledAt: baseScheduledAt,
      },
    );

    // Notificar progresso se atingiu limite diário
    if (updatedSession.dailyMessagesSent >= campaign.dailyMessageGoal) {
      this.notificationsService.notifyDailyLimitReached(
        campaign.organizationId,
        {
          campaignId: campaign.id,
          campaignName: campaign.name,
          sessionId: fromSession.sessionId,
          sessionName: updatedSession.session.name,
          messagesSent: updatedSession.dailyMessagesSent,
          dailyGoal: campaign.dailyMessageGoal,
        },
      );
    }

    // Notificar progresso geral
    this.notificationsService.notifyWarmupProgress(
      campaign.organizationId,
      {
        campaignId: campaign.id,
        campaignName: campaign.name,
        sessionId: fromSession.sessionId,
        sessionName: updatedSession.session.name,
        progress: {
          dailyMessagesSent: updatedSession.dailyMessagesSent,
          dailyGoal: campaign.dailyMessageGoal,
          totalMessagesSent: updatedSession.totalMessagesSent,
          successRate: 100, // Será calculado baseado nas execuções
          healthScore: updatedSession.healthScore,
        },
        lastExecution: {
          contactName: toSession.session.name || 'Sessão Interna',
          contactPhone: toSession.session.phone || '',
          messageContent: personalizedContent,
          executedAt: scheduledAt,
          status: 'scheduled',
        },
      },
    );

    return execution;
  }

  async findAll(organizationId: string) {
    return this.prisma.warmupCampaign.findMany({
      where: { organizationId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        campaignSessions: {
          include: {
            session: {
              select: { id: true, name: true, phone: true, status: true },
            },
          },
        },
        campaignContacts: {
          include: {
            contact: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        messageTemplates: true,
        mediaFiles: true,
        _count: {
          select: {
            campaignSessions: true,
            campaignContacts: true,
            messageTemplates: true,
            executions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: { id, organizationId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        campaignSessions: {
          include: {
            session: {
              select: { id: true, name: true, phone: true, status: true },
            },
            healthMetrics: {
              orderBy: { date: 'desc' },
              take: 7, // Últimos 7 dias
            },
          },
        },
        campaignContacts: {
          include: {
            contact: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        messageTemplates: {
          where: { isActive: true },
        },
        mediaFiles: {
          where: { isActive: true },
        },
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            fromSession: {
              select: { id: true, name: true },
            },
            contact: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        _count: {
          select: {
            campaignSessions: true,
            campaignContacts: true,
            messageTemplates: true,
            executions: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada');
    }

    return campaign;
  }

  async update(
    id: string,
    updateCampaignDto: UpdateWarmupCampaignDto,
    organizationId: string,
  ) {
    const campaign = await this.findOne(id, organizationId);

    const {
      sessionIds,
      contactIds,
      minIntervalMinutes,
      maxIntervalMinutes,
      workingHourStart,
      workingHourEnd,
      ...updateData
    } = updateCampaignDto;

    // Validações
    if (minIntervalMinutes && maxIntervalMinutes && updateData.randomizeInterval && minIntervalMinutes >= maxIntervalMinutes) {
      throw new BadRequestException(
        'Intervalo mínimo deve ser menor que o intervalo máximo quando randomização estiver habilitada',
      );
    }

    if (workingHourStart && workingHourEnd && workingHourStart >= workingHourEnd) {
      throw new BadRequestException(
        'Horário de início deve ser menor que o horário de fim',
      );
    }

    await this.prisma.warmupCampaign.update({
      where: { id },
      data: {
        ...updateData,
        minIntervalMinutes,
        maxIntervalMinutes,
        workingHourStart,
        workingHourEnd,
        updatedAt: new Date(),
      },
    });

    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string) {
    const campaign = await this.findOne(id, organizationId);

    await this.prisma.warmupCampaign.delete({
      where: { id },
    });

    return { message: 'Campanha removida com sucesso' };
  }

  // Gerenciamento de Sessões
  async addSessionsToCampaign(
    campaignId: string,
    addSessionsDto: AddSessionsToCampaignDto,
    organizationId: string,
  ) {
    const campaign = await this.findOne(campaignId, organizationId);

    // Verificar se as sessões existem e pertencem à organização
    const sessions = await this.prisma.whatsAppSession.findMany({
      where: {
        id: { in: addSessionsDto.sessionIds },
        organizationId,
        isActive: true,
      },
    });

    if (sessions.length !== addSessionsDto.sessionIds.length) {
      throw new BadRequestException('Uma ou mais sessões não foram encontradas');
    }

    // Adicionar sessões à campanha
    const campaignSessions = await Promise.all(
      sessions.map((session) =>
        this.prisma.warmupCampaignSession.upsert({
          where: {
            campaignId_sessionId: {
              campaignId,
              sessionId: session.id,
            },
          },
          create: {
            campaignId,
            sessionId: session.id,
          },
          update: {
            isActive: true,
          },
        }),
      ),
    );

    return { message: 'Sessões adicionadas com sucesso', data: campaignSessions };
  }

  async removeSessionFromCampaign(
    campaignId: string,
    sessionId: string,
    organizationId: string,
  ) {
    const campaign = await this.findOne(campaignId, organizationId);

    await this.prisma.warmupCampaignSession.delete({
      where: {
        campaignId_sessionId: {
          campaignId,
          sessionId,
        },
      },
    });

    return { message: 'Sessão removida da campanha com sucesso' };
  }

  // Gerenciamento de Contatos
  async addContactsToCampaign(
    campaignId: string,
    addContactsDto: AddContactsToCampaignDto,
    organizationId: string,
  ) {
    const campaign = await this.findOne(campaignId, organizationId);

    // Verificar se os contatos existem e pertencem à organização
    const contacts = await this.prisma.contact.findMany({
      where: {
        id: { in: addContactsDto.contactIds },
        organizationId,
        isActive: true,
      },
    });

    if (contacts.length !== addContactsDto.contactIds.length) {
      throw new BadRequestException('Um ou mais contatos não foram encontrados');
    }

    // Adicionar contatos à campanha
    const campaignContacts = await Promise.all(
      contacts.map((contact) =>
        this.prisma.warmupCampaignContact.upsert({
          where: {
            campaignId_contactId: {
              campaignId,
              contactId: contact.id,
            },
          },
          create: {
            campaignId,
            contactId: contact.id,
            priority: addContactsDto.priority || 1,
          },
          update: {
            isActive: true,
            priority: addContactsDto.priority || 1,
          },
        }),
      ),
    );

    return { message: 'Contatos adicionados com sucesso', data: campaignContacts };
  }

  async removeContactFromCampaign(
    campaignId: string,
    contactId: string,
    organizationId: string,
  ) {
    const campaign = await this.findOne(campaignId, organizationId);

    await this.prisma.warmupCampaignContact.delete({
      where: {
        campaignId_contactId: {
          campaignId,
          contactId,
        },
      },
    });

    return { message: 'Contato removido da campanha com sucesso' };
  }

  // Templates de Mensagem
  async createMessageTemplate(
    campaignId: string,
    createTemplateDto: CreateMessageTemplateDto,
    organizationId: string,
  ) {
    const campaign = await this.findOne(campaignId, organizationId);

    const template = await this.prisma.warmupMessageTemplate.create({
      data: {
        ...createTemplateDto,
        campaignId,
      },
    });

    return template;
  }

  async updateMessageTemplate(
    campaignId: string,
    templateId: string,
    updateTemplateDto: Partial<CreateMessageTemplateDto>,
    organizationId: string,
  ) {
    const campaign = await this.findOne(campaignId, organizationId);

    const template = await this.prisma.warmupMessageTemplate.findFirst({
      where: { id: templateId, campaignId },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    return this.prisma.warmupMessageTemplate.update({
      where: { id: templateId },
      data: updateTemplateDto,
    });
  }

  async deleteMessageTemplate(
    campaignId: string,
    templateId: string,
    organizationId: string,
  ) {
    const campaign = await this.findOne(campaignId, organizationId);

    const template = await this.prisma.warmupMessageTemplate.findFirst({
      where: { id: templateId, campaignId },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    await this.prisma.warmupMessageTemplate.delete({
      where: { id: templateId },
    });

    return { message: 'Template removido com sucesso' };
  }

  // Gerenciamento de Arquivos de Mídia
  async createTemplateWithFile(
    campaignId: string,
    file: Express.Multer.File,
    templateDto: any,
    organizationId: string,
  ) {
    const campaign = await this.findOne(campaignId, organizationId);

    // Determinar tipo do arquivo
    let fileType = 'document';
    if (file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (file.mimetype.startsWith('audio/')) {
      fileType = 'audio';
    } else if (file.mimetype.startsWith('video/')) {
      fileType = 'video';
    }

    // Salvar arquivo de mídia
    const mediaFile = await this.prisma.warmupMediaFile.create({
      data: {
        campaignId,
        fileName: file.originalname,
        filePath: file.path,
        fileType,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    // Criar template associado ao arquivo
    const template = await this.prisma.warmupMessageTemplate.create({
      data: {
        campaignId,
        content: templateDto.content || '',
        messageType: fileType,
        weight: templateDto.weight || 1,
        variables: templateDto.variables || {},
        mediaFileId: mediaFile.id,
      },
      include: {
        mediaFile: true,
      },
    });

    return template;
  }

  async getMediaFiles(campaignId: string, organizationId: string) {
    const campaign = await this.findOne(campaignId, organizationId);

    return this.prisma.warmupMediaFile.findMany({
      where: {
        campaignId,
        isActive: true,
      },
      include: {
        templates: {
          select: {
            id: true,
            content: true,
            weight: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteMediaFile(
    campaignId: string,
    mediaId: string,
    organizationId: string,
  ) {
    const campaign = await this.findOne(campaignId, organizationId);

    const mediaFile = await this.prisma.warmupMediaFile.findFirst({
      where: { id: mediaId, campaignId },
      include: { templates: true },
    });

    if (!mediaFile) {
      throw new NotFoundException('Arquivo de mídia não encontrado');
    }

    // Verificar se existem templates usando este arquivo
    if (mediaFile.templates.length > 0) {
      throw new BadRequestException(
        'Não é possível deletar arquivo que está sendo usado por templates',
      );
    }

    // Deletar arquivo físico
    const fs = require('fs');
    if (fs.existsSync(mediaFile.filePath)) {
      fs.unlinkSync(mediaFile.filePath);
    }

    // Deletar registro do banco
    await this.prisma.warmupMediaFile.delete({
      where: { id: mediaId },
    });

    return { message: 'Arquivo de mídia removido com sucesso' };
  }

  // Cálculo da Saúde do Número
  async calculateHealthScore(campaignSessionId: string): Promise<number> {
    try {
      // Buscar histórico dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const metrics = await this.prisma.warmupHealthMetric.findMany({
        where: {
          campaignSessionId,
          date: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      // Buscar execuções para calcular taxa de entrega real
      const executions = await this.prisma.warmupExecution.findMany({
        where: {
          fromSessionId: (await this.prisma.warmupCampaignSession.findUnique({
            where: { id: campaignSessionId },
            select: { sessionId: true }
          }))?.sessionId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          status: true,
          createdAt: true,
        },
      });

      if (metrics.length === 0 && executions.length === 0) {
        return 100.0; // Saúde perfeita se não há dados
      }

      // Calcular taxa de entrega baseada nas execuções reais
      const totalExecutions = executions.length;
      const sentExecutions = executions.filter(ex => ex.status === 'sent').length;
      const failedExecutions = executions.filter(ex => ex.status === 'failed').length;
      const deliveryRate = totalExecutions > 0 ? (sentExecutions / totalExecutions) * 100 : 100;

      // Calcular estatísticas de volume (baseado nas métricas ou execuções)
      let averageMessagesPerDay = 0;
      let standardDeviation = 0;
      let activityScore = 1;

      if (metrics.length > 0) {
        // Usar métricas se disponíveis
        const totalMessages = metrics.reduce((sum, metric) => sum + metric.messagesSent, 0);
        const totalDays = metrics.length;
        averageMessagesPerDay = totalMessages / totalDays;

        // Calcular variabilidade (desvio padrão)
        const variance = metrics.reduce((sum, metric) => {
          const diff = metric.messagesSent - averageMessagesPerDay;
          return sum + (diff * diff);
        }, 0) / totalDays;
        standardDeviation = Math.sqrt(variance);

        // Penalizar dias sem atividade
        const daysWithoutActivity = metrics.filter(m => m.messagesSent === 0).length;
        const activityPenalty = (daysWithoutActivity / totalDays) * 0.4;
        activityScore = Math.max(0, 1 - activityPenalty);
      } else {
        // Usar execuções se métricas não estão disponíveis
        const execsByDay = new Map<string, number>();
        executions.forEach(ex => {
          const day = ex.createdAt.toISOString().split('T')[0];
          execsByDay.set(day, (execsByDay.get(day) || 0) + 1);
        });

        if (execsByDay.size > 0) {
          const totalMessages = Array.from(execsByDay.values()).reduce((sum, count) => sum + count, 0);
          averageMessagesPerDay = totalMessages / execsByDay.size;

          // Calcular desvio padrão
          const values = Array.from(execsByDay.values());
          const variance = values.reduce((sum, count) => {
            const diff = count - averageMessagesPerDay;
            return sum + (diff * diff);
          }, 0) / values.length;
          standardDeviation = Math.sqrt(variance);
        }
      }

      // Parâmetros da curva de saúde
      const OPTIMAL_CENTER = 35; // 35 mensagens por dia
      
      // Calcular saúde baseada na média diária
      let baseHealth = this.calculateGaussianHealth(averageMessagesPerDay, OPTIMAL_CENTER, 15);
      
      // Penalizar alta variabilidade (comportamento errático)
      const consistencyPenalty = Math.min(standardDeviation / 10, 0.3);
      const consistencyScore = Math.max(0, 1 - consistencyPenalty);
      
      // Fator de taxa de entrega (peso importante)
      const deliveryScore = deliveryRate / 100;
      
      // Calcular saúde final (0-100)
      const finalHealth = baseHealth * consistencyScore * activityScore * deliveryScore * 100;
      const healthScore = Math.max(0, Math.min(100, finalHealth));

      // Buscar informações da sessão para atualização
      const campaignSession = await this.prisma.warmupCampaignSession.findUnique({
        where: { id: campaignSessionId },
        include: {
          campaign: {
            select: { id: true, name: true, organizationId: true },
          },
          session: {
            select: { id: true, name: true, phone: true },
          },
        },
      });

      if (campaignSession) {
        const previousHealth = campaignSession.healthScore;
        const healthChange = healthScore - previousHealth;

        // Atualizar a saúde na sessão da campanha
        await this.prisma.warmupCampaignSession.update({
          where: { id: campaignSessionId },
          data: { healthScore },
        });

        // Log da atualização de saúde
        console.log(`📊 Saúde atualizada para sessão ${campaignSessionId}: ${healthScore.toFixed(1)}% (${averageMessagesPerDay.toFixed(1)} msg/dia, entrega: ${deliveryRate.toFixed(1)}%, σ=${standardDeviation.toFixed(1)})`);

        // Notificar mudanças significativas de saúde
        if (Math.abs(healthChange) >= 5) {
          this.notificationsService.notifyHealthUpdate(
            campaignSession.campaign.organizationId,
            {
              campaignId: campaignSession.campaign.id,
              campaignName: campaignSession.campaign.name,
              sessionId: campaignSession.sessionId,
              sessionName: this.getSessionName(campaignSession),
              phone: campaignSession.session.phone || '',
              previousHealth,
              currentHealth: healthScore,
              healthChange,
              metrics: {
                messagesSent: totalExecutions,
                messagesDelivered: sentExecutions,
                messagesRead: 0, // TODO: Implementar quando houver dados de leitura
                responsesReceived: 0, // TODO: Implementar quando houver dados de resposta
                averageMessagesPerHour: averageMessagesPerDay / 24,
              },
              calculatedAt: new Date(),
            }
          );
        }
      }

      return healthScore;
    } catch (error) {
      console.error(`❌ Erro ao calcular saúde para ${campaignSessionId}:`, error);
      return 100.0; // Retornar saúde neutra em caso de erro
    }
  }

  // Sistema de Execução Automática
  @Cron('*/10 * * * * *') // A cada 10 segundos
  async processWarmupExecutions() {
    console.log('Processando execuções de aquecimento...');

    // Primeiro processar execuções agendadas que já chegaram na hora
    await this.processScheduledExecutions();

    // Depois processar campanhas ativas para agendar novas execuções
    const activeCampaigns = await this.prisma.warmupCampaign.findMany({
      where: { isActive: true },
      include: {
        campaignSessions: {
          where: { isActive: true },
          include: { session: true },
        },
        campaignContacts: {
          where: { isActive: true },
          include: { contact: true },
        },
        messageTemplates: {
          where: { isActive: true },
        },
      },
    });

    // Log do processamento geral
    if (activeCampaigns.length > 0) {
      console.log(`📊 Processando ${activeCampaigns.length} campanhas ativas`);
    }

    for (const campaign of activeCampaigns) {
      await this.processWarmupCampaign(campaign);
    }
  }

  // Sistema de marcar mensagens como lidas (agora usando configurações de sessões de aquecimento)
  @Cron('*/10 * * * * *') // A cada 10 segundos para verificar qual sessão precisa processar
  async processReadMessages() {
    console.log('🔄 Processando marcação de mensagens como lidas...');

    // Buscar sessões de aquecimento ativas com auto-read habilitado
    const warmupSessionsWithAutoRead = await this.prisma.warmupCampaignSession.findMany({
      where: {
        isActive: true,
        autoReadEnabled: true,
        session: {
          status: 'CONNECTED'
        },
        campaign: {
          isActive: true
        }
      },
      include: {
        session: true,
        campaign: {
          include: {
            organization: true
          }
        }
      }
    });

    console.log(`📊 Encontradas ${warmupSessionsWithAutoRead.length} sessões de aquecimento ativas com auto-read habilitado`);

    const now = new Date();

    for (const warmupSession of warmupSessionsWithAutoRead) {
      try {
        // Verificar se já passou o intervalo configurado desde a última execução
        const lastProcessedKey = `autoread_warmup_${warmupSession.id}`;
        const lastProcessed = this.getLastProcessedTime(lastProcessedKey);
        const intervalMs = warmupSession.autoReadInterval * 1000;

        if (now.getTime() - lastProcessed < intervalMs) {
          continue; // Ainda não é hora de processar esta sessão de aquecimento
        }

        console.log(`⏰ Processando sessão de aquecimento: [${warmupSession.campaign.name}] - ${warmupSession.session.name}`);

        // Atualizar timestamp da última execução
        this.setLastProcessedTime(lastProcessedKey, now.getTime());

        // Obter TODOS os chats ativos para esta sessão (não apenas não lidos)
        const allConversations = await this.whatsappService.getAllActiveChats(
          warmupSession.session.sessionId,
          warmupSession.campaign.organizationId
        );

        if (allConversations.length > 0) {
          console.log(`📨 Sessão de Aquecimento [${warmupSession.campaign.name}] - ${warmupSession.session.name}: ${allConversations.length} conversas ativas encontradas`);

          // Marcar mensagens como lidas em intervalos diferentes para cada conversa
          for (const conversation of allConversations) {
            // Usar configurações específicas da sessão de aquecimento para o delay
            const minDelay = warmupSession.autoReadMinDelay * 1000;
            const maxDelay = warmupSession.autoReadMaxDelay * 1000;
            const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
            
            console.log(`⏳ Agendando leitura do chat ${conversation.chatId} em ${delay}ms (${conversation.unreadCount} mensagens)`);
            
            setTimeout(async () => {
              try {
                console.log(`🚀 Iniciando marcação como lido para chat ${conversation.chatId}`);
                
                const result = await this.whatsappService.markMessagesAsRead(
                  warmupSession.session.sessionId,
                  warmupSession.campaign.organizationId,
                  conversation.chatId
                );

                if (result.success) {
                  console.log(`✅ [${warmupSession.session.name}] SUCESSO: Chat ${conversation.chatId} marcado como lido - ${result.message}`);
                } else {
                  console.log(`❌ [${warmupSession.session.name}] FALHA: ${result.message}`);
                }
              } catch (error) {
                console.error(`❌ [${warmupSession.session.name}] ERRO CRÍTICO ao marcar chat ${conversation.chatId} como lido:`, error.message);
              }
            }, delay);
          }
        } else {
          console.log(`📭 [${warmupSession.session.name}] Nenhuma conversa ativa encontrada`);
        }
      } catch (error) {
        console.error(`❌ ERRO ao processar leituras para sessão de aquecimento ${warmupSession.id}:`, error.message);
      }
    }
  }

  // Métodos auxiliares para controlar timestamps das execuções
  private lastProcessedTimes = new Map<string, number>();

  private getLastProcessedTime(key: string): number {
    return this.lastProcessedTimes.get(key) || 0;
  }

  private setLastProcessedTime(key: string, timestamp: number): void {
    this.lastProcessedTimes.set(key, timestamp);
  }

  private async processWarmupCampaign(campaign: any) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Verificar se estamos no horário permitido
    if (!this.isWithinAllowedTime(campaign, now)) {
      // Notificar que a campanha está aguardando horário
      this.notificationsService.notifyCampaignStatus(
        campaign.organizationId,
        campaign.id,
        campaign.name,
        'waiting',
        'Aguardando horário permitido para envio',
        this.getNextAllowedTime(campaign, now),
        0,
        campaign.campaignSessions.length
      );
      return;
    }

    let activeSessions = 0;
    let totalMessagesInQueue = 0;

    for (const campaignSession of campaign.campaignSessions) {
      // Verificar se a sessão existe e está válida
      if (!campaignSession.session) {
        this.logger.warn(`Sessão não encontrada para campaignSession ${campaignSession.id}, pulando...`);
        continue;
      }

      // Verificar limite diário
      const shouldResetDaily = this.shouldResetDailyCount(campaignSession.lastResetDate);
      
      if (shouldResetDaily) {
        await this.prisma.warmupCampaignSession.update({
          where: { id: campaignSession.id },
          data: {
            dailyMessagesSent: 0,
            lastResetDate: today,
          },
        });
        campaignSession.dailyMessagesSent = 0;

        // Log do reset diário
        this.notificationsService.logCampaignInfo(
          campaign.organizationId,
          campaign.id,
          campaign.name,
          'Contador diário resetado',
          undefined,
          campaignSession.sessionId,
          this.getSessionName(campaignSession)
        );
      }

      // Verificar se já atingiu a meta diária
      if (campaignSession.dailyMessagesSent >= campaign.dailyMessageGoal) {
        this.notificationsService.logCampaignInfo(
          campaign.organizationId,
          campaign.id,
          campaign.name,
          `Meta diária atingida: ${campaignSession.dailyMessagesSent}/${campaign.dailyMessageGoal}`,
          undefined,
          campaignSession.sessionId,
          this.getSessionName(campaignSession)
        );
        continue;
      }

      // Verificar intervalo desde a última mensagem
      if (!this.canSendMessage(campaignSession, campaign, now)) {
        const nextSendTime = this.getNextSendTime(campaignSession, campaign, now);
        totalMessagesInQueue++;
        continue;
      }

      activeSessions++;

      // Decidir se vai ser conversa interna ou externa
      const shouldUseInternalConversation = 
        campaign.enableInternalConversations && 
        campaign.campaignSessions.length > 1 &&
        Math.random() < campaign.internalConversationRatio;

      if (shouldUseInternalConversation) {
        // Selecionar uma sessão de destino diferente da atual
        const availableSessions = campaign.campaignSessions.filter(
          s => s.sessionId !== campaignSession.sessionId && s.isActive
        );
        
        if (availableSessions.length > 0) {
          const toSession = availableSessions[Math.floor(Math.random() * availableSessions.length)];
          const template = this.selectRandomTemplate(campaign.messageTemplates);
          
          if (template) {
            // Log da conversa interna sendo agendada
            this.notificationsService.logCampaignInfo(
              campaign.organizationId,
              campaign.id,
              campaign.name,
              `Agendando conversa interna: ${this.getSessionName(campaignSession)} → ${this.getSessionName(toSession)}`,
              { template: template?.name || 'Template Indefinido' },
              campaignSession.sessionId,
              this.getSessionName(campaignSession)
            );

            await this.scheduleInternalConversation(campaign, campaignSession, toSession, template, false);
            continue; // Pular para a próxima sessão
          } else {
            this.notificationsService.logCampaignWarning(
              campaign.organizationId,
              campaign.id,
              campaign.name,
              'Nenhum template disponível para conversa interna',
              undefined,
              campaignSession.sessionId,
              this.getSessionName(campaignSession)
            );
          }
        } else {
          this.notificationsService.logCampaignWarning(
            campaign.organizationId,
            campaign.id,
            campaign.name,
            'Não há sessões disponíveis para conversa interna',
            undefined,
            campaignSession.sessionId,
            this.getSessionName(campaignSession)
          );
        }
      }

      // Conversa externa (com contatos)
      const contact = this.selectRandomContact(campaign.campaignContacts);
      if (!contact) {
        this.notificationsService.logCampaignWarning(
          campaign.organizationId,
          campaign.id,
          campaign.name,
          'Nenhum contato disponível para mensagem externa',
          undefined,
          campaignSession.sessionId,
          this.getSessionName(campaignSession)
        );
        continue;
      }

      // Selecionar template aleatório
      const template = this.selectRandomTemplate(campaign.messageTemplates);
      if (!template) {
        this.notificationsService.logCampaignWarning(
          campaign.organizationId,
          campaign.id,
          campaign.name,
          'Nenhum template disponível para mensagem externa',
          undefined,
          campaignSession.sessionId,
          this.getSessionName(campaignSession)
        );
        continue;
      }

      // Log da mensagem externa sendo agendada
      this.notificationsService.logCampaignInfo(
        campaign.organizationId,
        campaign.id,
        campaign.name,
        `Agendando mensagem externa para: ${contact?.name || contact?.phone || 'Contato Desconhecido'}`,
        { template: template?.name || 'Template Indefinido', contactPhone: contact?.phone || 'Telefone Indefinido' },
        campaignSession.sessionId,
        this.getSessionName(campaignSession)
      );

      // Agendar mensagem externa
      await this.scheduleMessage(campaign, campaignSession, contact, template);
    }

    // Log final do processamento da campanha
    this.notificationsService.logCampaignInfo(
      campaign.organizationId,
      campaign.id,
      campaign.name,
      `Processamento concluído: ${activeSessions} sessões ativas`,
      { 
        activeSessions,
        totalSessions: campaign.campaignSessions.length 
      }
    );

    // Atualizar status da campanha se necessário
    if (activeSessions === 0) {
      this.notificationsService.notifyCampaignStatus(
        campaign.organizationId,
        campaign.id,
        campaign.name,
        'waiting',
        'Todas as sessões completaram a meta diária ou estão aguardando intervalo',
        undefined,
        0,
        campaign.campaignSessions.length
      );
    } else {
      this.notificationsService.notifyCampaignStatus(
        campaign.organizationId,
        campaign.id,
        campaign.name,
        'active',
        'Campanha em execução',
        undefined,
        activeSessions,
        campaign.campaignSessions.length
      );
    }
  }

  // Processar execuções agendadas que chegaram na hora
  private async processScheduledExecutions() {
    console.log('Processando execuções agendadas...');
    
    const now = new Date();
    console.log(`Horário atual: ${now.toISOString()}`);
    
    // Primeiro, vamos ver quantas execuções scheduled existem no total
    const totalScheduled = await this.prisma.warmupExecution.count({
      where: {
        status: 'scheduled',
      },
    });
    console.log(`Total de execuções scheduled no banco: ${totalScheduled}`);
    
    // Buscar execuções agendadas que já chegaram na hora
    const scheduledExecutions = await this.prisma.warmupExecution.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          lte: now,
        },
      },
      include: {
        campaign: {
          include: {
            organization: true,
          },
        },
        fromSession: true,
        toSession: true,
        contact: true,
        template: {
          include: {
            mediaFile: true,
          },
        },
      },
      take: 50, // Processar no máximo 50 execuções por vez
    });

    console.log(`Encontradas ${scheduledExecutions.length} execuções para processar`);
    
    // Debug: vamos ver as execuções que não estão sendo processadas
    if (totalScheduled > 0 && scheduledExecutions.length === 0) {
      const nextExecutions = await this.prisma.warmupExecution.findMany({
        where: {
          status: 'scheduled',
        },
        select: {
          id: true,
          scheduledAt: true,
          messageContent: true,
        },
        orderBy: {
          scheduledAt: 'asc',
        },
        take: 5,
      });
      
      console.log('Próximas execuções agendadas:');
      nextExecutions.forEach(exec => {
        console.log(`- ID: ${exec.id}, Agendada para: ${exec.scheduledAt.toISOString()}, Mensagem: ${exec.messageContent.substring(0, 50)}...`);
      });
    }

    for (const execution of scheduledExecutions) {
      try {
        // Verificar se a sessão remetente está em pausa automática
        const fromCampaignSession = await this.prisma.warmupCampaignSession.findFirst({
          where: {
            campaignId: execution.campaignId,
            sessionId: execution.fromSessionId,
          },
        });

        if (fromCampaignSession) {
          const isInPause = await this.isSessionInAutoPause(fromCampaignSession.id);
          if (isInPause) {
            console.log(`⏸️ Sessão ${execution.fromSessionId} está em pausa automática - execução ${execution.id} será reagendada`);
            
            // Reagendar para depois da pausa + um pequeno delay
            const session = await this.prisma.warmupCampaignSession.findUnique({
              where: { id: fromCampaignSession.id },
              select: { currentPauseUntil: true }
            });
            
            if (session?.currentPauseUntil) {
              const newScheduledAt = new Date(session.currentPauseUntil.getTime() + 60000); // +1 minuto
              await this.prisma.warmupExecution.update({
                where: { id: execution.id },
                data: { scheduledAt: newScheduledAt },
              });
              continue; // Pular para próxima execução
            }
          }
        }

        await this.executeScheduledMessage(execution);
      } catch (error) {
        console.error(`Erro ao executar mensagem agendada ${execution.id}:`, error);
        
        // Marcar como erro
        await this.prisma.warmupExecution.update({
          where: { id: execution.id },
          data: {
            status: 'failed',
            sentAt: now,
            errorMessage: error.message,
          },
        });
      }
    }
  }

  // Executar uma mensagem específica agendada
  private async executeScheduledMessage(execution: any) {
    const now = new Date();
    
    try {
      // Log de início da execução
      this.notificationsService.notifyExecutionLog(
        execution.campaign.organizationId,
        execution.id,
        execution.campaignId,
        execution.campaign.name,
        execution.fromSessionId,
        execution.fromSession.name,
        execution.executionType,
        'sending',
        execution.contact?.name,
        execution.toSession?.name,
        execution.messageContent,
        execution.scheduledAt,
        now
      );

      // Buscar o campaignSessionId correto
      const campaignSession = await this.prisma.warmupCampaignSession.findFirst({
        where: {
          campaignId: execution.campaignId,
          sessionId: execution.fromSessionId,
        },
      });

      if (!campaignSession) {
        throw new Error(`Campaign session não encontrada para campaignId: ${execution.campaignId}, sessionId: ${execution.fromSessionId}`);
      }

      let messageResult;
      
      if (execution.executionType === 'internal') {
        // Para conversas internas, buscar a sessão de destino
        const toSession = await this.prisma.whatsAppSession.findFirst({
          where: {
            id: execution.toSessionId,
            organizationId: execution.campaign.organizationId,
            status: 'CONNECTED',
          },
        });

        if (!toSession) {
          throw new Error('Sessão de destino não encontrada ou não conectada');
        }

        // Log da mensagem interna
        this.notificationsService.logCampaignInfo(
          execution.campaign.organizationId,
          execution.campaignId,
          execution.campaign.name,
          `Enviando mensagem interna: ${execution.fromSession.name} → ${toSession.name}`,
          { messageContent: execution.messageContent.substring(0, 50) + '...', executionId: execution.id },
          execution.fromSessionId,
          execution.fromSession.name
        );

        // Enviar mensagem interna (para o número da sessão de destino)
        messageResult = await this.whatsappService.sendMessage(
          execution.fromSession.sessionId,
          execution.campaign.organizationId,
          toSession.phone || '',
          execution.messageContent,
          execution.messageType,
          execution.template?.mediaFile?.filePath
        );
      } else {
        // Log da mensagem externa
        this.notificationsService.logCampaignInfo(
          execution.campaign.organizationId,
          execution.campaignId,
          execution.campaign.name,
          `Enviando mensagem externa: ${execution.fromSession.name} → ${execution.contact.name}`,
          { 
            messageContent: execution.messageContent.substring(0, 50) + '...', 
            executionId: execution.id,
            contactPhone: execution.contact.phone 
          },
          execution.fromSessionId,
          execution.fromSession.name
        );

        // Para conversas externas, enviar para o contato
        messageResult = await this.whatsappService.sendMessage(
          execution.fromSession.sessionId,
          execution.campaign.organizationId,
          execution.contact.phone,
          execution.messageContent,
          execution.messageType,
          execution.template?.mediaFile?.filePath
        );
      }

      // Marcar como enviada
      await this.prisma.warmupExecution.update({
        where: { id: execution.id },
        data: {
          status: 'sent',
          sentAt: now,
        },
      });

      // Log de sucesso da execução
      this.notificationsService.notifyExecutionLog(
        execution.campaign.organizationId,
        execution.id,
        execution.campaignId,
        execution.campaign.name,
        execution.fromSessionId,
        execution.fromSession.name,
        execution.executionType,
        'sent',
        execution.contact?.name,
        execution.toSession?.name,
        execution.messageContent,
        execution.scheduledAt,
        now
      );

      // Atualizar métricas de saúde diárias usando o campaignSessionId correto
      await this.updateHealthMetrics(campaignSession.id, now);

      // Notificar execução bem-sucedida
      this.notificationsService.notifyWarmupExecution(
        execution.campaign.organizationId,
        {
          campaignId: execution.campaignId,
          campaignName: execution.campaign.name,
          sessionId: execution.fromSession.sessionId,
          sessionName: execution.fromSession.name,
          contactId: execution.contact?.id,
          contactName: execution.contact?.name || execution.toSession?.name,
          contactPhone: execution.contact?.phone || execution.toSession?.phone,
          messageContent: execution.messageContent,
          messageType: execution.messageType,
          status: 'sent',
          scheduledAt: execution.scheduledAt,
        },
      );

      console.log(`✅ Mensagem enviada: ${execution.fromSession.name} → ${execution.contact?.name || execution.toSession?.name}`);

    } catch (error) {
      // Log de erro detalhado
      this.notificationsService.logCampaignError(
        execution.campaign.organizationId,
        execution.campaignId,
        execution.campaign.name,
        `Erro ao enviar mensagem: ${error.message}`,
        { 
          executionId: execution.id,
          error: error.message,
          targetContact: execution.contact?.name,
          targetSession: execution.toSession?.name 
        },
        execution.fromSessionId,
        execution.fromSession.name
      );

      // Log de erro na execução
      this.notificationsService.notifyExecutionLog(
        execution.campaign.organizationId,
        execution.id,
        execution.campaignId,
        execution.campaign.name,
        execution.fromSessionId,
        execution.fromSession.name,
        execution.executionType,
        'failed',
        execution.contact?.name,
        execution.toSession?.name,
        execution.messageContent,
        execution.scheduledAt,
        new Date(),
        error.message
      );

      console.error(`❌ Erro ao enviar mensagem:`, error);
      throw error;
    }
  }

  /**
   * Verifica se uma sessão está em pausa automática
   */
  private async isSessionInAutoPause(campaignSessionId: string): Promise<boolean> {
    const session = await this.prisma.warmupCampaignSession.findUnique({
      where: { id: campaignSessionId },
      select: { currentPauseUntil: true }
    });

    if (!session?.currentPauseUntil) {
      return false;
    }

    const now = new Date();
    return session.currentPauseUntil > now;
  }

  /**
   * Verifica se é hora de aplicar uma pausa automática baseada no tempo de conversa
   */
  private async checkAndApplyAutoPause(campaign: any, campaignSession: any): Promise<boolean> {
    // Verificar se pausas automáticas estão habilitadas
    if (!campaign.enableAutoPauses) {
      return false;
    }

    const now = new Date();
    
    // Se não há início de conversa registrado, registrar agora
    if (!campaignSession.conversationStartedAt) {
      await this.prisma.warmupCampaignSession.update({
        where: { id: campaignSession.id },
        data: { conversationStartedAt: now }
      });
      return false;
    }

    // Calcular tempo decorrido desde o início da conversa
    const conversationDuration = now.getTime() - campaignSession.conversationStartedAt.getTime();
    const conversationMinutes = conversationDuration / (1000 * 60);

    // Verificar se passou do tempo mínimo de conversa
    if (conversationMinutes < campaign.minConversationTimeMinutes) {
      return false;
    }

    // Aplicar pausa automática randomizada
    const pauseTimeMinutes = Math.floor(Math.random() * campaign.maxPauseTimeMinutes) + 1;
    const pauseUntil = new Date(now.getTime() + pauseTimeMinutes * 60 * 1000);

    await this.prisma.warmupCampaignSession.update({
      where: { id: campaignSession.id },
      data: {
        currentPauseUntil: pauseUntil,
        lastConversationStart: campaignSession.conversationStartedAt,
        conversationStartedAt: null // Reset para próxima conversa
      }
    });

    console.log(`🛑 Pausa automática aplicada para sessão ${campaignSession.sessionId}`);
    console.log(`⏰ Duração da pausa: ${pauseTimeMinutes} minutos`);
    console.log(`🕒 Retorno previsto: ${pauseUntil.toISOString()}`);

    return true;
  }

  /**
   * Calcula o próximo horário de envio considerando pausas automáticas
   */
  private async calculateNextScheduleTime(campaign: any, campaignSession: any, baseScheduledAt: Date): Promise<Date> {
    if (!campaign.enableAutoPauses) {
      return baseScheduledAt;
    }

    // Verificar se está em pausa
    const isInPause = await this.isSessionInAutoPause(campaignSession.id);
    if (isInPause) {
      // Se está em pausa, agendar após o fim da pausa com um pequeno delay adicional
      const session = await this.prisma.warmupCampaignSession.findUnique({
        where: { id: campaignSession.id },
        select: { currentPauseUntil: true }
      });
      
      if (session?.currentPauseUntil) {
        const additionalDelay = Math.floor(Math.random() * 300) + 60; // 1-5 minutos adicionais
        return new Date(session.currentPauseUntil.getTime() + additionalDelay * 1000);
      }
    }

    // Verificar se deve aplicar pausa
    const pauseApplied = await this.checkAndApplyAutoPause(campaign, campaignSession);
    if (pauseApplied) {
      // Recalcular após aplicar pausa
      return this.calculateNextScheduleTime(campaign, campaignSession, baseScheduledAt);
    }

    return baseScheduledAt;
  }

  // Atualizar métricas de saúde diárias
  private async updateHealthMetrics(campaignSessionId: string, executionDate: Date) {
    try {
      // Verificar se o campaignSessionId existe
      const campaignSessionExists = await this.prisma.warmupCampaignSession.findUnique({
        where: { id: campaignSessionId },
        select: { id: true },
      });

      if (!campaignSessionExists) {
        console.error(`⚠️ Campaign session ${campaignSessionId} não encontrada. Pulando atualização de métricas.`);
        return;
      }

      const today = new Date(executionDate);
      today.setHours(0, 0, 0, 0); // Normalizar para início do dia

      // Buscar ou criar métrica do dia
      const existingMetric = await this.prisma.warmupHealthMetric.findUnique({
        where: {
          campaignSessionId_date: {
            campaignSessionId,
            date: today,
          },
        },
      });

      let updatedMetric;
      if (existingMetric) {
        // Atualizar métrica existente
        updatedMetric = await this.prisma.warmupHealthMetric.update({
          where: { id: existingMetric.id },
          data: {
            messagesSent: { increment: 1 },
            messagesDelivered: { increment: 1 }, // Por enquanto assumindo que toda mensagem 'sent' é entregue
          },
        });
      } else {
        // Criar nova métrica para o dia
        updatedMetric = await this.prisma.warmupHealthMetric.create({
          data: {
            campaignSessionId,
            date: today,
            messagesSent: 1,
            messagesDelivered: 1, // Por enquanto assumindo que toda mensagem 'sent' é entregue
            messagesRead: 0,
            responsesReceived: 0,
            averageMessagesPerHour: 0,
            healthScore: 100.0,
          },
        });
      }

      // Recalcular saúde baseada no histórico
      await this.calculateHealthScore(campaignSessionId);
      
    } catch (error) {
      console.error(`❌ Erro ao atualizar métricas de saúde para campaignSessionId ${campaignSessionId}:`, error);
      // Não propagar o erro para não quebrar o fluxo principal de envio de mensagens
    }
  }

  /**
   * Calcula a pontuação de saúde baseada no padrão de envio de mensagens
   * Usa uma curva gaussiana onde a faixa ideal é 20-50 mensagens por dia
  /**
   * Calcula saúde usando distribuição gaussiana
   * @param value Valor atual (mensagens por dia)
   * @param optimal Valor ótimo (centro da curva)
   * @param spread Dispersão da curva (desvio padrão)
   * @returns Pontuação de 0 a 1
   */
  private calculateGaussianHealth(value: number, optimal: number, spread: number): number {
    // Fórmula da distribuição normal: e^(-0.5 * ((x - μ) / σ)^2)
    const exponent = -0.5 * Math.pow((value - optimal) / spread, 2);
    return Math.exp(exponent);
  }

  /**
   * Obtém estatísticas de entrega para uma sessão específica
   */
  async getDeliveryStats(sessionId: string, days: number = 30): Promise<{
    totalExecutions: number;
    sentExecutions: number;
    failedExecutions: number;
    pendingExecutions: number;
    scheduledExecutions: number;
    deliveryRate: number;
    failureRate: number;
    period: { from: Date; to: Date };
  }> {
    const now = new Date();
    const fromDate = new Date();
    fromDate.setDate(now.getDate() - days);

    // Buscar todas as execuções da sessão no período
    const executions = await this.prisma.warmupExecution.findMany({
      where: {
        fromSessionId: sessionId,
        createdAt: {
          gte: fromDate,
          lte: now,
        },
      },
      select: {
        status: true,
        createdAt: true,
      },
    });

    // Calcular estatísticas
    const totalExecutions = executions.length;
    const sentExecutions = executions.filter(ex => ex.status === 'sent').length;
    const failedExecutions = executions.filter(ex => ex.status === 'failed').length;
    const pendingExecutions = executions.filter(ex => ex.status === 'pending').length;
    const scheduledExecutions = executions.filter(ex => ex.status === 'scheduled').length;

    const deliveryRate = totalExecutions > 0 ? (sentExecutions / totalExecutions) * 100 : 0;
    const failureRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0;

    return {
      totalExecutions,
      sentExecutions,
      failedExecutions,
      pendingExecutions,
      scheduledExecutions,
      deliveryRate: Math.round(deliveryRate * 100) / 100, // Arredondar para 2 casas decimais
      failureRate: Math.round(failureRate * 100) / 100,
      period: {
        from: fromDate,
        to: now,
      },
    };
  }

  private isWithinAllowedTime(campaign: any, now: Date): boolean {
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = domingo, 6 = sábado

    // Verificar fins de semana
    if (!campaign.allowWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return false;
    }

    // Verificar horário comercial
    if (campaign.useWorkingHours) {
      return hour >= campaign.workingHourStart && hour < campaign.workingHourEnd;
    }

    return true;
  }

  private shouldResetDailyCount(lastResetDate: Date): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastReset = new Date(lastResetDate);
    
    return lastReset < today;
  }

  private getNextAllowedTime(campaign: any, now: Date): Date | undefined {
    if (!campaign.startTime || !campaign.endTime) {
      return undefined;
    }

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + currentMinute / 60;

    // Se estamos antes do horário de início, próximo horário é hoje no startTime
    if (currentTime < campaign.startTime) {
      const nextTime = new Date(now);
      const startHour = Math.floor(campaign.startTime);
      const startMinute = Math.round((campaign.startTime - startHour) * 60);
      nextTime.setHours(startHour, startMinute, 0, 0);
      return nextTime;
    }

    // Se estamos depois do horário de fim, próximo horário é amanhã no startTime
    if (currentTime >= campaign.endTime) {
      const nextTime = new Date(now);
      nextTime.setDate(nextTime.getDate() + 1);
      const startHour = Math.floor(campaign.startTime);
      const startMinute = Math.round((campaign.startTime - startHour) * 60);
      nextTime.setHours(startHour, startMinute, 0, 0);
      return nextTime;
    }

    return undefined; // Estamos no horário permitido
  }

  private getNextSendTime(campaignSession: any, campaign: any, now: Date): Date | undefined {
    if (!campaignSession.lastMessageSentAt) {
      return undefined; // Pode enviar agora
    }

    const timeSinceLastMessage = now.getTime() - campaignSession.lastMessageSentAt.getTime();
    const minIntervalMs = campaign.minInterval * 60 * 1000; // Converter minutos para ms

    if (timeSinceLastMessage >= minIntervalMs) {
      return undefined; // Pode enviar agora
    }

    // Calcular próximo horário permitido
    const nextTime = new Date(campaignSession.lastMessageSentAt.getTime() + minIntervalMs);
    return nextTime;
  }

  private canSendMessage(campaignSession: any, campaign: any, now: Date): boolean {
    if (!campaignSession.lastMessageAt) {
      return true; // Primeira mensagem
    }

    const timeSinceLastMessage = now.getTime() - campaignSession.lastMessageAt.getTime();
    const minInterval = campaign.minIntervalMinutes * 60 * 1000; // Converter para ms

    return timeSinceLastMessage >= minInterval;
  }

  private selectRandomContact(campaignContacts: any[]): any {
    if (campaignContacts.length === 0) {
      return null;
    }

    // Implementar seleção baseada em prioridade
    const weightedContacts = campaignContacts.flatMap(cc => 
      Array(cc.priority).fill(cc.contact)
    );

    const randomIndex = Math.floor(Math.random() * weightedContacts.length);
    return weightedContacts[randomIndex];
  }

  private selectRandomTemplate(templates: any[]): any {
    if (templates.length === 0) {
      return null;
    }

    // Implementar seleção baseada em peso
    const weightedTemplates = templates.flatMap(template => 
      Array(template.weight).fill(template)
    );

    const randomIndex = Math.floor(Math.random() * weightedTemplates.length);
    return weightedTemplates[randomIndex];
  }

  private async scheduleMessage(
    campaign: any,
    campaignSession: any,
    contact: any,
    template: any,
  ) {
    // Calcular horário de envio com randomização
    const now = new Date();
    let scheduledAt = new Date(now);

    if (campaign.randomizeInterval) {
      const minInterval = campaign.minIntervalMinutes;
      const maxInterval = campaign.maxIntervalMinutes;
      const randomMinutes = Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval;
      scheduledAt = new Date(now.getTime() + randomMinutes * 60 * 1000);
    } else {
      scheduledAt = new Date(now.getTime() + campaign.minIntervalMinutes * 60 * 1000);
    }

    // Personalizar mensagem
    const personalizedContent = this.personalizeMessage(template.content, contact);

    // Criar execução
    const execution = await this.prisma.warmupExecution.create({
      data: {
        campaignId: campaign.id,
        fromSessionId: campaignSession.sessionId,
        contactId: contact.id,
        templateId: template.id,
        messageContent: personalizedContent,
        messageType: template.messageType,
        executionType: 'external',
        status: 'scheduled',
        scheduledAt,
      },
    });

    // Atualizar contadores
    const updatedSession = await this.prisma.warmupCampaignSession.update({
      where: { id: campaignSession.id },
      data: {
        dailyMessagesSent: { increment: 1 },
        totalMessagesSent: { increment: 1 },
        lastMessageAt: scheduledAt,
      },
      include: {
        session: true,
      },
    });

    // Notificar execução agendada
    this.notificationsService.notifyWarmupExecution(
      campaign.organizationId,
      {
        campaignId: campaign.id,
        campaignName: campaign.name,
        sessionId: campaignSession.sessionId,
        sessionName: updatedSession.session.name,
        contactId: contact.id,
        contactName: contact.name,
        contactPhone: contact.phone,
        messageContent: personalizedContent,
        messageType: template.messageType,
        status: 'scheduled',
        scheduledAt,
      },
    );

    // Notificar progresso se atingiu limite diário
    if (updatedSession.dailyMessagesSent >= campaign.dailyMessageGoal) {
      this.notificationsService.notifyDailyLimitReached(
        campaign.organizationId,
        {
          campaignId: campaign.id,
          campaignName: campaign.name,
          sessionId: campaignSession.sessionId,
          sessionName: updatedSession.session.name,
          messagesSent: updatedSession.dailyMessagesSent,
          dailyGoal: campaign.dailyMessageGoal,
        },
      );
    }

    // Notificar progresso geral
    this.notificationsService.notifyWarmupProgress(
      campaign.organizationId,
      {
        campaignId: campaign.id,
        campaignName: campaign.name,
        sessionId: campaignSession.sessionId,
        sessionName: updatedSession.session.name,
        progress: {
          dailyMessagesSent: updatedSession.dailyMessagesSent,
          dailyGoal: campaign.dailyMessageGoal,
          totalMessagesSent: updatedSession.totalMessagesSent,
          successRate: 100, // Será calculado baseado nas execuções
          healthScore: updatedSession.healthScore,
        },
        lastExecution: {
          contactName: contact.name,
          contactPhone: contact.phone,
          messageContent: personalizedContent,
          executedAt: scheduledAt,
          status: 'scheduled',
        },
      },
    );

    return execution;
  }

  private personalizeMessage(content: string, contact: any): string {
    let personalizedContent = content;

    // Substituir variáveis comuns
    personalizedContent = personalizedContent.replace(/{nome}/g, contact.name || 'amigo');
    personalizedContent = personalizedContent.replace(/{telefone}/g, contact.phone || '');
    personalizedContent = personalizedContent.replace(/{email}/g, contact.email || '');

    // Adicionar variáveis de tempo
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'Olá';
    
    if (hour < 12) {
      greeting = 'Bom dia';
    } else if (hour < 18) {
      greeting = 'Boa tarde';
    } else {
      greeting = 'Boa noite';
    }

    personalizedContent = personalizedContent.replace(/{saudacao}/g, greeting);

    return personalizedContent;
  }

  // Estatísticas e Relatórios
  async getCampaignStats(campaignId: string, organizationId: string) {
    const campaign = await this.findOne(campaignId, organizationId);

    const [executions, sessions] = await Promise.all([
      this.prisma.warmupExecution.groupBy({
        by: ['status'],
        where: { campaignId },
        _count: true,
      }),
      this.prisma.warmupCampaignSession.findMany({
        where: { campaignId },
        include: {
          session: {
            select: { id: true, name: true, phone: true },
          },
          healthMetrics: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    const totalExecutions = executions.reduce((sum, item) => sum + item._count, 0);
    const successfulExecutions = executions
      .filter(item => ['sent', 'delivered', 'read'].includes(item.status))
      .reduce((sum, item) => sum + item._count, 0);

    const averageHealthScore = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + session.healthScore, 0) / sessions.length
      : 100;

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        isActive: campaign.isActive,
      },
      stats: {
        totalExecutions,
        successfulExecutions,
        successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
        averageHealthScore,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.isActive).length,
      },
      sessions: sessions.map(session => ({
        id: session.id,
        sessionId: session.sessionId,
        sessionName: session.session.name,
        phone: session.session.phone,
        healthScore: session.healthScore,
        dailyMessagesSent: session.dailyMessagesSent,
        totalMessagesSent: session.totalMessagesSent,
        isActive: session.isActive,
        lastHealthUpdate: session.healthMetrics[0]?.date || null,
      })),
    };
  }

  // Dashboard de Monitoramento
  async getDashboard(organizationId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Buscar todas as campanhas da organização
    const campaigns = await this.prisma.warmupCampaign.findMany({
      where: { organizationId },
      include: {
        campaignSessions: {
          include: {
            session: true,
          },
        },
        campaignContacts: true,
        messageTemplates: true,
        executions: {
          where: {
            createdAt: {
              gte: today,
            },
          },
        },
      },
    });

    // Calcular estatísticas gerais
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.isActive).length;
    const totalSessions = campaigns.reduce((sum, c) => sum + c.campaignSessions.length, 0);
    const activeSessions = campaigns.reduce(
      (sum, c) => sum + c.campaignSessions.filter(s => s.isActive).length, 
      0
    );
    const internalConversationsEnabled = campaigns.filter(c => c.enableInternalConversations).length;

    // Estatísticas de mensagens de hoje
    const todaysExecutions = campaigns.flatMap(c => c.executions);
    const totalMessagesSentToday = todaysExecutions.length;
    const internalMessagesToday = todaysExecutions.filter(e => e.executionType === 'internal').length;
    const externalMessagesToday = todaysExecutions.filter(e => e.executionType === 'external').length;

    // Calcular saúde média
    const allSessions = campaigns.flatMap(c => c.campaignSessions);
    const averageHealthScore = allSessions.length > 0 
      ? allSessions.reduce((sum, s) => sum + s.healthScore, 0) / allSessions.length 
      : 0;

    // Contatos totais
    const totalContacts = campaigns.reduce((sum, c) => sum + c.campaignContacts.length, 0);

    // Templates ativos
    const activeTemplates = campaigns.reduce(
      (sum, c) => sum + c.messageTemplates.filter(t => t.isActive).length, 
      0
    );

    // Atividades recentes (últimas 5)
    const recentExecutions = await this.prisma.warmupExecution.findMany({
      where: {
        campaign: {
          organizationId,
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24h
        },
      },
      include: {
        campaign: true,
        fromSession: true,
        toSession: true,
        contact: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    const recentActivity = recentExecutions.map(exec => {
      if (exec.executionType === 'internal') {
        return {
          type: 'internal_conversation',
          campaignName: exec.campaign.name,
          fromSessionName: exec.fromSession.name,
          toSessionName: exec.toSession?.name,
          messageContent: exec.messageContent,
          timestamp: exec.createdAt,
        };
      } else {
        return {
          type: 'external_message',
          campaignName: exec.campaign.name,
          sessionName: exec.fromSession.name,
          contactName: exec.contact?.name,
          timestamp: exec.createdAt,
        };
      }
    });

    // Alertas
    const alerts: Array<{
      type: string;
      campaignId: string;
      message: string;
      severity: 'warning' | 'info' | 'error';
    }> = [];
    
    // Alertas de saúde baixa
    for (const campaign of campaigns) {
      if (campaign.campaignSessions.length === 0) {
        // Pular campanhas sem sessões
        continue;
      }

      const avgHealthScore = campaign.campaignSessions.reduce((sum, s) => sum + s.healthScore, 0) / campaign.campaignSessions.length;
      
      if (avgHealthScore < 70 && campaign.isActive) {
        alerts.push({
          type: 'health_warning',
          campaignId: campaign.id,
          message: `Health score below 70% (${avgHealthScore.toFixed(1)}%)`,
          severity: 'warning',
        });
      }

      // Alertas de conversas internas desabilitadas
      if (campaign.campaignSessions.length > 1 && !campaign.enableInternalConversations) {
        alerts.push({
          type: 'internal_conversations_disabled',
          campaignId: campaign.id,
          message: 'Campaign has multiple sessions but internal conversations are disabled',
          severity: 'info',
        });
      }
    }

    return {
      overview: {
        totalCampaigns,
        activeCampaigns,
        totalSessions,
        activeSessions,
        totalMessagesSentToday,
        internalMessagesToday,
        externalMessagesToday,
        averageHealthScore: Math.round(averageHealthScore * 10) / 10,
        totalContacts,
        activeTemplates,
        internalConversationsEnabled,
      },
      recentActivity,
      alerts,
    };
  }

  // Relatório de Saúde das Campanhas
  async getHealthReport(organizationId: string) {
    // Buscar todas as campanhas da organização
    const campaigns = await this.prisma.warmupCampaign.findMany({
      where: { organizationId },
      include: {
        campaignSessions: {
          include: {
            session: true,
          },
        },
        campaignContacts: true,
        messageTemplates: true,
        executions: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // última semana
            },
          },
        },
      },
    });

    // Estatísticas gerais
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.isActive).length;
    const pausedCampaigns = campaigns.filter(c => !c.isActive).length;
    const totalSessions = campaigns.reduce((sum, c) => sum + c.campaignSessions.length, 0);
    const internalConversationsEnabled = campaigns.filter(c => c.enableInternalConversations).length;

    // Calcular saúde média geral
    const allSessions = campaigns.flatMap(c => c.campaignSessions);
    const averageHealthScore = allSessions.length > 0 
      ? allSessions.reduce((sum, s) => sum + s.healthScore, 0) / allSessions.length 
      : 0;

    // Campanhas com problemas
    const campaignsWithIssues = campaigns.filter(campaign => {
      if (campaign.campaignSessions.length === 0) return false;
      const avgHealthScore = campaign.campaignSessions.reduce((sum, s) => sum + s.healthScore, 0) / campaign.campaignSessions.length;
      return avgHealthScore < 70;
    }).length;

    // Analisar cada campanha individualmente
    const campaignReports = campaigns.map(campaign => {
      const sessionCount = campaign.campaignSessions.length;
      const avgHealthScore = sessionCount > 0
        ? campaign.campaignSessions.reduce((sum, s) => sum + s.healthScore, 0) / sessionCount
        : 0;

      // Identificar problemas
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Análise de saúde
      if (sessionCount === 0) {
        issues.push("No sessions assigned to campaign");
        recommendations.push("Add at least one WhatsApp session to start warming up");
      } else {
        if (avgHealthScore < 40) {
          issues.push("Critical health score - high risk of blocks");
          recommendations.push("Reduce daily message goal and review contact quality");
        } else if (avgHealthScore < 70) {
          issues.push("Low health score detected");
          recommendations.push("Review message templates and contact engagement");
        }

        // Análise de taxa de falha
        const totalExecutions = campaign.executions.length;
        const failedExecutions = campaign.executions.filter(e => e.status === 'failed').length;
        const failureRate = totalExecutions > 0 ? failedExecutions / totalExecutions : 0;

        if (failureRate > 0.1) {
          issues.push("High failure rate detected");
          recommendations.push("Check session connectivity and contact phone numbers");
        }

        // Análise de configuração de conversas internas
        if (sessionCount > 1 && !campaign.enableInternalConversations) {
          issues.push("Multiple sessions but internal conversations disabled");
          recommendations.push("Enable internal conversations to improve warming effectiveness");
        } else if (campaign.enableInternalConversations && campaign.internalConversationRatio < 0.2) {
          recommendations.push("Consider increasing internal conversation ratio for better warming");
        }

        // Análise de templates
        const activeTemplates = campaign.messageTemplates.filter(t => t.isActive).length;
        if (activeTemplates === 0) {
          issues.push("No message templates configured");
          recommendations.push("Add diverse message templates for natural conversations");
        } else if (activeTemplates < 3) {
          recommendations.push("Add more message templates to avoid repetitive patterns");
        }

        // Análise de atividade
        if (totalExecutions === 0 && campaign.isActive) {
          issues.push("No executions recorded despite active status");
          recommendations.push("Check campaign configuration and session connectivity");
        }
      }

      return {
        id: campaign.id,
        name: campaign.name,
        averageHealthScore: Math.round(avgHealthScore * 10) / 10,
        isActive: campaign.isActive,
        sessionCount,
        enableInternalConversations: campaign.enableInternalConversations,
        internalConversationRatio: campaign.internalConversationRatio,
        issues,
        recommendations,
      };
    });

    return {
      summary: {
        totalCampaigns,
        activeCampaigns,
        pausedCampaigns,
        averageHealthScore: Math.round(averageHealthScore * 10) / 10,
        campaignsWithIssues,
        totalSessions,
        internalConversationsEnabled,
      },
      campaigns: campaignReports,
    };
  }

  // Controles da Campanha
  async pauseCampaign(id: string, organizationId: string) {
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: { id, organizationId },
    });

    if (!campaign) {
      throw new BadRequestException('Campaign not found');
    }

    if (!campaign.isActive) {
      throw new BadRequestException('Campaign is already paused');
    }

    const updatedCampaign = await this.prisma.warmupCampaign.update({
      where: { id },
      data: { isActive: false },
    });

    // Log da pausa da campanha
    this.notificationsService.logCampaignWarning(
      organizationId,
      id,
      campaign.name,
      'Campanha pausada manualmente'
    );

    // Notificar mudança de status
    this.notificationsService.notifyCampaignStatus(
      organizationId,
      id,
      campaign.name,
      'paused',
      'Pausada pelo usuário'
    );

    return {
      message: 'Campaign paused successfully',
      isActive: false,
      pausedAt: new Date(),
    };
  }

  async resumeCampaign(id: string, organizationId: string) {
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: { id, organizationId },
      include: {
        campaignSessions: {
          where: { isActive: true },
          include: { session: true },
        },
        campaignContacts: {
          where: { isActive: true },
          include: { contact: true },
        },
        messageTemplates: {
          where: { isActive: true },
        },
      },
    });

    if (!campaign) {
      throw new BadRequestException('Campaign not found');
    }

    if (campaign.isActive) {
      throw new BadRequestException('Campaign is already active');
    }

    // Ativar a campanha
    const updatedCampaign = await this.prisma.warmupCampaign.update({
      where: { id },
      data: { isActive: true },
    });

    // Enviar mensagens de teste imediatamente após retomar
    const testExecutions = await this.sendTestMessagesOnResume(campaign);

    // Log da retomada da campanha
    this.notificationsService.logCampaignSuccess(
      organizationId,
      id,
      campaign.name,
      `Campanha retomada com ${testExecutions.length} mensagens de teste`
    );

    // Notificar mudança de status
    this.notificationsService.notifyCampaignStatus(
      organizationId,
      id,
      campaign.name,
      'active',
      'Retomada pelo usuário',
      undefined,
      testExecutions.length,
      campaign.campaignSessions.length
    );

    return {
      message: 'Campaign resumed successfully',
      isActive: true,
      resumedAt: new Date(),
      testExecutions: testExecutions.length,
      testMessages: testExecutions,
    };
  }

  // Método para enviar mensagens de teste quando a campanha for retomada
  private async sendTestMessagesOnResume(campaign: any): Promise<any[]> {
    const testExecutions: any[] = [];

    try {
      // Verificar se há sessões, contatos e templates disponíveis
      if (campaign.campaignSessions.length === 0) {
        console.log(`Campanha ${campaign.id}: Nenhuma sessão ativa encontrada`);
        return testExecutions;
      }

      if (campaign.messageTemplates.length === 0) {
        console.log(`Campanha ${campaign.id}: Nenhum template ativo encontrado`);
        return testExecutions;
      }

      console.log(`Enviando mensagens de teste para campanha retomada: ${campaign.name}`);

      // 1. Enviar uma conversa interna se habilitada e há múltiplas sessões
      if (campaign.enableInternalConversations && campaign.campaignSessions.length > 1) {
        const fromSession = campaign.campaignSessions[0];
        const toSession = campaign.campaignSessions[1];
        const template = this.selectRandomTemplate(campaign.messageTemplates);

        if (template) {
          const execution = await this.scheduleInternalConversation(
            campaign,
            fromSession,
            toSession,
            template,
            true, // isTestMessage = true
          );
          testExecutions.push({
            type: 'internal',
            executionId: execution.id,
            fromSession: this.getSessionName(fromSession),
            toSession: this.getSessionName(toSession),
          });
          console.log(`✅ Conversa interna teste agendada: ${this.getSessionName(fromSession)} → ${this.getSessionName(toSession)}`);
        }
      }

      // 2. Enviar uma mensagem externa se há contatos disponíveis
      if (campaign.campaignContacts.length > 0) {
        const campaignSession = campaign.campaignSessions[0]; // Usar primeira sessão
        const contact = this.selectRandomContact(campaign.campaignContacts);
        const template = this.selectRandomTemplate(campaign.messageTemplates);

        if (contact && template) {
          const execution = await this.scheduleMessage(
            campaign,
            campaignSession,
            contact,
            template
          );
          testExecutions.push({
            type: 'external',
            executionId: execution.id,
            fromSession: this.getSessionName(campaignSession),
            toContact: contact.name,
          });
          console.log(`✅ Mensagem externa teste agendada: ${this.getSessionName(campaignSession)} → ${contact.name}`);
        }
      }

      // 3. Se há múltiplas sessões, enviar mais algumas conversas internas
      if (campaign.enableInternalConversations && campaign.campaignSessions.length > 2) {
        for (let i = 0; i < Math.min(2, campaign.campaignSessions.length - 1); i++) {
          const fromSession = campaign.campaignSessions[i];
          const availableSessions = campaign.campaignSessions.filter(
            s => s.sessionId !== fromSession.sessionId
          );
          
          if (availableSessions.length > 0) {
            const toSession = availableSessions[Math.floor(Math.random() * availableSessions.length)];
            const template = this.selectRandomTemplate(campaign.messageTemplates);

            if (template) {
              // Agendar com pequeno delay para evitar spam
              setTimeout(async () => {
                try {
                  const execution = await this.scheduleInternalConversation(
                    campaign,
                    fromSession,
                    toSession,
                    template,
                    true, // É uma mensagem de teste adicional
                  );
                  console.log(`✅ Conversa interna adicional agendada: ${this.getSessionName(fromSession)} → ${this.getSessionName(toSession)}`);
                } catch (error) {
                  console.error('Erro ao agendar conversa interna adicional:', error);
                }
              }, (i + 1) * 30000); // 30 segundos entre cada mensagem

              testExecutions.push({
                type: 'internal_delayed',
                fromSession: fromSession.session.name,
                toSession: toSession.session.name,
                delaySeconds: (i + 1) * 30,
              });
            }
          }
        }
      }

      console.log(`🎉 Campanha ${campaign.name} retomada com ${testExecutions.length} mensagens de teste`);
      
    } catch (error) {
      console.error('Erro ao enviar mensagens de teste:', error);
    }

    return testExecutions;
  }

  async forceExecution(
    id: string,
    data: {
      executionType: 'internal' | 'external';
      fromSessionId: string;
      contactId?: string;
      toSessionId?: string;
      templateId?: string;
    },
    organizationId: string,
  ) {
    // Validar campanha
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: { id, organizationId },
      include: {
        campaignSessions: {
          include: { session: true },
        },
        messageTemplates: true,
      },
    });

    if (!campaign) {
      throw new BadRequestException('Campaign not found');
    }

    // Validar sessão de origem
    const fromSession = campaign.campaignSessions.find(
      cs => cs.sessionId === data.fromSessionId
    );

    if (!fromSession) {
      throw new BadRequestException('From session not found in campaign');
    }

    let execution;

    if (data.executionType === 'internal') {
      // Validar sessão de destino para conversa interna
      if (!data.toSessionId) {
        throw new BadRequestException('toSessionId is required for internal conversations');
      }

      const toSession = campaign.campaignSessions.find(
        cs => cs.sessionId === data.toSessionId
      );

      if (!toSession) {
        throw new BadRequestException('To session not found in campaign');
      }

      // Selecionar template
      let template;
      if (data.templateId) {
        template = campaign.messageTemplates.find(t => t.id === data.templateId);
        if (!template) {
          throw new BadRequestException('Template not found');
        }
      } else {
        // Selecionar template aleatório
        const activeTemplates = campaign.messageTemplates.filter(t => t.isActive);
        if (activeTemplates.length > 0) {
          template = this.selectRandomTemplate(activeTemplates);
        }
      }

      if (!template) {
        throw new BadRequestException('No active templates available');
      }

      // Processar conteúdo da mensagem
      const messageContent = this.personalizeMessage(
        template.content,
        {
          name: toSession.session.name || toSession.session.phone,
          phone: toSession.session.phone,
        }
      );

      // Criar execução
      execution = await this.prisma.warmupExecution.create({
        data: {
          campaignId: id,
          fromSessionId: data.fromSessionId,
          toSessionId: data.toSessionId,
          templateId: template.id,
          messageContent,
          messageType: template.messageType,
          executionType: 'internal',
          status: 'scheduled',
          scheduledAt: new Date(),
        },
      });

    } else {
      // Execução externa
      if (!data.contactId) {
        throw new BadRequestException('contactId is required for external executions');
      }

      // Validar contato
      const contact = await this.prisma.contact.findFirst({
        where: { 
          id: data.contactId,
          organizationId,
        },
      });

      if (!contact) {
        throw new BadRequestException('Contact not found');
      }

      // Selecionar template
      let template;
      if (data.templateId) {
        template = campaign.messageTemplates.find(t => t.id === data.templateId);
        if (!template) {
          throw new BadRequestException('Template not found');
        }
      } else {
        // Selecionar template aleatório
        const activeTemplates = campaign.messageTemplates.filter(t => t.isActive);
        if (activeTemplates.length > 0) {
          template = this.selectRandomTemplate(activeTemplates);
        }
      }

      if (!template) {
        throw new BadRequestException('No active templates available');
      }

      // Processar conteúdo da mensagem
      const messageContent = this.personalizeMessage(
        template.content,
        contact
      );

      // Criar execução
      execution = await this.prisma.warmupExecution.create({
        data: {
          campaignId: id,
          fromSessionId: data.fromSessionId,
          contactId: data.contactId,
          templateId: template.id,
          messageContent,
          messageType: template.messageType,
          executionType: 'external',
          status: 'scheduled',
          scheduledAt: new Date(),
        },
      });
    }

    return {
      message: 'Execution scheduled successfully',
      execution: {
        id: execution.id,
        executionType: execution.executionType,
        fromSessionId: execution.fromSessionId,
        toSessionId: execution.toSessionId,
        contactId: execution.contactId,
        scheduledAt: execution.scheduledAt,
        status: execution.status,
      },
    };
  }

  // Alias para getCampaignStats para compatibilidade com frontend
  async getCampaignStatistics(campaignId: string, organizationId: string, period?: string) {
    return this.getCampaignStats(campaignId, organizationId);
  }

  // ===== MÉTODOS FALTANTES =====

  // 6. Listar Sessões da Campanha
  async getCampaignSessions(campaignId: string, organizationId: string, status?: string) {
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: { id: campaignId, organizationId },
      include: {
        campaignSessions: {
          where: status ? { isActive: status === 'active' } : {},
          include: {
            session: true,
            healthMetrics: {
              where: {
                date: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
              },
              orderBy: { date: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const sessions = campaign.campaignSessions.map(cs => ({
      id: cs.id,
      sessionId: cs.sessionId,
      session: {
        id: cs.session.id,
        name: cs.session.name,
        phone: cs.session.phone,
        status: cs.session.status,
      },
      healthScore: cs.healthScore,
      dailyMessagesSent: cs.dailyMessagesSent,
      totalMessagesSent: cs.totalMessagesSent,
      lastMessageAt: cs.lastMessageAt,
      isActive: cs.isActive,
      healthMetrics: cs.healthMetrics.map(hm => ({
        date: hm.date,
        messagesSent: hm.messagesSent,
        messagesDelivered: hm.messagesDelivered,
        messagesRead: hm.messagesRead,
        responsesReceived: hm.responsesReceived,
        averageMessagesPerHour: hm.averageMessagesPerHour,
      })),
    }));

    // Calcular resumo
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.isActive).length;
    const averageHealthScore = totalSessions > 0 
      ? sessions.reduce((sum, s) => sum + s.healthScore, 0) / totalSessions 
      : 0;
    const totalDailyMessages = sessions.reduce((sum, s) => sum + s.dailyMessagesSent, 0);

    // Calcular conversas internas hoje
    const internalConversationsToday = await this.prisma.warmupExecution.count({
      where: {
        campaignId,
        executionType: 'internal',
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    return {
      data: sessions,
      summary: {
        totalSessions,
        activeSessions,
        averageHealthScore: Math.round(averageHealthScore * 10) / 10,
        totalDailyMessages,
        internalConversationsToday,
      },
    };
  }

  // 9. Estatísticas de Conversas Internas
  async getInternalConversationsStats(campaignId: string, organizationId: string, period: string = 'today') {
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Calcular período
    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default: // today
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    // Estatísticas do período
    const internalExecutions = await this.prisma.warmupExecution.findMany({
      where: {
        campaignId,
        executionType: 'internal',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        fromSession: true,
        toSession: true,
      },
    });

    const externalExecutions = await this.prisma.warmupExecution.count({
      where: {
        campaignId,
        executionType: 'external',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalInternal = internalExecutions.length;
    const totalExternal = externalExecutions;
    const totalExecutions = totalInternal + totalExternal;
    
    const internalRatio = totalExecutions > 0 ? totalInternal / totalExecutions : 0;
    const successRate = totalInternal > 0 
      ? (internalExecutions.filter(ex => ex.status === 'delivered' || ex.status === 'read').length / totalInternal) * 100 
      : 100;

    // Agrupar por pares de sessões
    const sessionPairMap = new Map();
    internalExecutions.forEach(execution => {
      const key = `${execution.fromSessionId}-${execution.toSessionId}`;
      if (!sessionPairMap.has(key)) {
        sessionPairMap.set(key, {
          fromSession: {
            id: execution.fromSession.id,
            name: execution.fromSession.name,
          },
          toSession: {
            id: execution.toSession?.id,
            name: execution.toSession?.name,
          },
          conversations: [],
        });
      }
      sessionPairMap.get(key).conversations.push(execution);
    });

    const sessionPairs = Array.from(sessionPairMap.values()).map(pair => {
      const conversations = pair.conversations;
      return {
        fromSession: pair.fromSession,
        toSession: pair.toSession,
        conversationCount: conversations.length,
        lastConversation: conversations.length > 0 
          ? Math.max(...conversations.map(c => new Date(c.sentAt || c.createdAt).getTime()))
          : null,
        averageInterval: conversations.length > 1 
          ? conversations.reduce((sum, conv, i) => {
              if (i === 0) return sum;
              const prevTime = new Date(conversations[i-1].sentAt || conversations[i-1].createdAt).getTime();
              const currTime = new Date(conv.sentAt || conv.createdAt).getTime();
              return sum + (currTime - prevTime);
            }, 0) / (conversations.length - 1) / 1000 // em segundos
          : 0,
      };
    });

    // Conversas recentes (últimas 10)
    const recentConversations = internalExecutions
      .sort((a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime())
      .slice(0, 10)
      .map(execution => ({
        id: execution.id,
        fromSessionName: execution.fromSession.name,
        toSessionName: execution.toSession?.name,
        messageContent: execution.messageContent,
        status: execution.status,
        sentAt: execution.sentAt || execution.createdAt,
      }));

    return {
      period,
      summary: {
        totalInternalExecutions: totalInternal,
        totalExternalExecutions: totalExternal,
        internalRatio: Math.round(internalRatio * 100) / 100,
        configuredRatio: campaign.internalConversationRatio,
        successRate: Math.round(successRate * 10) / 10,
      },
      sessionPairs,
      recentConversations,
    };
  }

  // 10. Forçar Conversa Interna
  async forceInternalConversation(
    campaignId: string,
    data: {
      fromSessionId: string;
      toSessionId: string;
      templateId?: string;
    },
    organizationId: string,
  ) {
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: { id: campaignId, organizationId },
      include: {
        campaignSessions: {
          include: { session: true },
        },
        messageTemplates: {
          where: { isActive: true },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Validar sessões
    const fromSession = campaign.campaignSessions.find(cs => cs.sessionId === data.fromSessionId);
    const toSession = campaign.campaignSessions.find(cs => cs.sessionId === data.toSessionId);

    if (!fromSession || !toSession) {
      throw new BadRequestException('Session not found in campaign');
    }

    // Selecionar template
    let template;
    if (data.templateId) {
      template = campaign.messageTemplates.find(t => t.id === data.templateId);
      if (!template) {
        throw new BadRequestException('Template not found');
      }
    } else {
      // Selecionar template aleatório
      const activeTemplates = campaign.messageTemplates.filter(t => t.isActive);
      if (activeTemplates.length === 0) {
        throw new BadRequestException('No active templates available');
      }
      template = this.selectRandomTemplate(activeTemplates);
    }

    // Personalizar mensagem
    const messageContent = this.personalizeMessage(template.content, {
      name: toSession.session.name || toSession.session.phone,
      phone: toSession.session.phone,
    });

    // Criar execução
    const execution = await this.prisma.warmupExecution.create({
      data: {
        campaignId,
        fromSessionId: data.fromSessionId,
        toSessionId: data.toSessionId,
        templateId: template.id,
        messageContent,
        messageType: template.messageType,
        executionType: 'internal',
        status: 'scheduled',
        scheduledAt: new Date(),
      },
    });

    return {
      message: 'Internal conversation scheduled successfully',
      execution: {
        id: execution.id,
        executionType: execution.executionType,
        fromSessionId: execution.fromSessionId,
        toSessionId: execution.toSessionId,
        messageContent: execution.messageContent,
        status: execution.status,
        scheduledAt: execution.scheduledAt,
      },
    };
  }

  // 11. Listar Templates da Campanha
  async getCampaignTemplates(
    campaignId: string, 
    organizationId: string, 
    filters: { type?: string; active?: boolean } = {}
  ) {
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const whereClause: any = { campaignId };
    
    if (filters.type) {
      whereClause.messageType = filters.type;
    }
    
    if (typeof filters.active === 'boolean') {
      whereClause.isActive = filters.active;
    }

    const templates = await this.prisma.warmupMessageTemplate.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Calcular estatísticas de uso
    const templatesWithUsage = await Promise.all(
      templates.map(async (template) => {
        const totalUsage = await this.prisma.warmupExecution.count({
          where: { templateId: template.id },
        });
        
        const internalUsage = await this.prisma.warmupExecution.count({
          where: { 
            templateId: template.id,
            executionType: 'internal',
          },
        });

        return {
          ...template,
          usageCount: totalUsage,
          internalUsage,
          externalUsage: totalUsage - internalUsage,
        };
      })
    );

    // Calcular resumo
    const totalTemplates = templates.length;
    const activeTemplates = templates.filter(t => t.isActive).length;
    const textTemplates = templates.filter(t => t.messageType === 'text').length;
    const mediaTemplates = templates.filter(t => t.messageType !== 'text').length;
    const totalUsage = templatesWithUsage.reduce((sum, t) => sum + t.usageCount, 0);
    const internalUsage = templatesWithUsage.reduce((sum, t) => sum + t.internalUsage, 0);
    const externalUsage = templatesWithUsage.reduce((sum, t) => sum + t.externalUsage, 0);

    return {
      data: templatesWithUsage,
      summary: {
        totalTemplates,
        activeTemplates,
        textTemplates,
        mediaTemplates,
        totalUsage,
        internalUsage,
        externalUsage,
      },
    };
  }

  // 13. Listar Contatos da Campanha
  async getCampaignContacts(campaignId: string, organizationId: string) {
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: { id: campaignId, organizationId },
      include: {
        campaignContacts: {
          include: {
            contact: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const contactsWithStats = await Promise.all(
      campaign.campaignContacts.map(async (cc) => {
        // Última interação
        const lastExecution = await this.prisma.warmupExecution.findFirst({
          where: {
            campaignId,
            contactId: cc.contact.id,
          },
          orderBy: { sentAt: 'desc' },
        });

        // Contador de interações
        const interactionCount = await this.prisma.warmupExecution.count({
          where: {
            campaignId,
            contactId: cc.contact.id,
          },
        });

        // Tempo médio de resposta (simulado por enquanto)
        const averageResponseTime = 3600; // 1 hora em segundos

        return {
          id: cc.contact.id,
          name: cc.contact.name,
          phone: cc.contact.phone,
          lastInteraction: lastExecution?.sentAt || null,
          interactionCount,
          averageResponseTime,
        };
      })
    );

    return {
      data: contactsWithStats,
    };
  }

  // 16. Histórico de Execuções
  async getExecutionHistory(
    campaignId: string,
    organizationId: string,
    filters: {
      status?: string;
      executionType?: string;
      fromSessionId?: string;
      toSessionId?: string;
      startDate?: string;
      endDate?: string;
      page: number;
      limit: number;
    }
  ) {
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const whereClause: any = { campaignId };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.executionType) {
      whereClause.executionType = filters.executionType;
    }

    if (filters.fromSessionId) {
      whereClause.fromSessionId = filters.fromSessionId;
    }

    if (filters.toSessionId) {
      whereClause.toSessionId = filters.toSessionId;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    const [executions, total] = await Promise.all([
      this.prisma.warmupExecution.findMany({
        where: whereClause,
        include: {
          fromSession: true,
          toSession: true,
          contact: true,
          template: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.prisma.warmupExecution.count({ where: whereClause }),
    ]);

    const executionsFormatted = executions.map(execution => ({
      id: execution.id,
      executionType: execution.executionType,
      status: execution.status,
      scheduledAt: execution.scheduledAt,
      sentAt: execution.sentAt,
      deliveredAt: execution.deliveredAt,
      readAt: execution.readAt,
      fromSession: {
        id: execution.fromSession.id,
        name: execution.fromSession.name,
        phone: execution.fromSession.phone,
      },
      toSession: execution.toSession ? {
        id: execution.toSession.id,
        name: execution.toSession.name,
        phone: execution.toSession.phone,
      } : null,
      contact: execution.contact ? {
        id: execution.contact.id,
        name: execution.contact.name,
        phone: execution.contact.phone,
      } : null,
      template: execution.template ? {
        id: execution.template.id,
        content: execution.template.content,
      } : null,
      messageContent: execution.messageContent,
      responseTime: execution.readAt && execution.sentAt 
        ? Math.floor((new Date(execution.readAt).getTime() - new Date(execution.sentAt).getTime()) / 1000 / 60) // em minutos
        : null,
      error: execution.errorMessage,
    }));

    // Calcular resumo
    const totalInternal = await this.prisma.warmupExecution.count({
      where: { ...whereClause, executionType: 'internal' },
    });
    
    const totalExternal = await this.prisma.warmupExecution.count({
      where: { ...whereClause, executionType: 'external' },
    });

    const successfulInternal = await this.prisma.warmupExecution.count({
      where: { 
        ...whereClause, 
        executionType: 'internal',
        status: { in: ['delivered', 'read'] },
      },
    });

    const successfulExternal = await this.prisma.warmupExecution.count({
      where: { 
        ...whereClause, 
        executionType: 'external',
        status: { in: ['delivered', 'read'] },
      },
    });

    return {
      data: executionsFormatted,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
      summary: {
        totalInternal,
        totalExternal,
        internalSuccessRate: totalInternal > 0 ? Math.round((successfulInternal / totalInternal) * 100 * 10) / 10 : 0,
        externalSuccessRate: totalExternal > 0 ? Math.round((successfulExternal / totalExternal) * 100 * 10) / 10 : 0,
      },
    };
  }

  // 22. Importar Templates/Mensagens em JSON
  async importTemplates(
    campaignId: string,
    importData: ImportTemplatesDto,
    organizationId: string,
  ) {
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const { templates, replaceExisting = false } = importData;

    // Validar templates
    if (!templates || !Array.isArray(templates) || templates.length === 0) {
      throw new BadRequestException('Templates array is required and cannot be empty');
    }

    // Validar cada template
    const validatedTemplates = templates.map((template, index) => {
      if (!template.name || !template.content) {
        throw new BadRequestException(`Template at index ${index} must have name and content`);
      }

      return {
        name: template.name.trim(),
        content: template.content.trim(),
        messageType: template.messageType || 'text',
        weight: Math.max(1, Math.min(10, template.weight || 1)), // Entre 1 e 10
        isActive: template.isActive !== undefined ? template.isActive : true,
      };
    });

    // Se replaceExisting for true, desativar todos os templates existentes
    if (replaceExisting) {
      await this.prisma.warmupMessageTemplate.updateMany({
        where: { campaignId },
        data: { isActive: false },
      });
    }

    // Criar novos templates
    const createdTemplates: any[] = [];
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (const template of validatedTemplates) {
      try {
        // Usar apenas o conteúdo do template, sem adicionar o nome
        const templateContent = template.content;
        
        const createdTemplate = await this.prisma.warmupMessageTemplate.create({
          data: {
            campaignId,
            content: templateContent,
            messageType: template.messageType,
            weight: template.weight,
            isActive: template.isActive,
            variables: {
              name: template.name, // Salvar o nome nas variáveis JSON para referência
            },
          },
        });

        createdTemplates.push({
          id: createdTemplate.id,
          name: template.name,
          content: template.content,
          messageType: createdTemplate.messageType,
          weight: createdTemplate.weight,
          isActive: createdTemplate.isActive,
        });
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push({
          template: template.name,
          error: error.message,
        });
      }
    }

    // Calcular estatísticas finais
    const totalActiveTemplates = await this.prisma.warmupMessageTemplate.count({
      where: { campaignId, isActive: true },
    });

    return {
      message: 'Templates import completed',
      summary: {
        totalImported: templates.length,
        successfulImports: successCount,
        failedImports: errorCount,
        replaceExisting,
        totalActiveTemplates,
      },
      createdTemplates,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Função para testar o sistema de pausas automáticas
   */
  async testAutoPause(
    campaignId: string,
    data: {
      enableAutoPauses: boolean;
      maxPauseTimeMinutes: number;
      minConversationTimeMinutes: number;
    },
    organizationId: string,
  ) {
    // Verificar se a campanha existe e pertence à organização
    const campaign = await this.prisma.warmupCampaign.findFirst({
      where: {
        id: campaignId,
        organizationId,
      },
      include: {
        campaignSessions: {
          include: {
            session: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada');
    }

    // Atualizar configurações de pausa automática da campanha
    const updatedCampaign = await this.prisma.warmupCampaign.update({
      where: { id: campaignId },
      data: {
        enableAutoPauses: data.enableAutoPauses,
        maxPauseTimeMinutes: data.maxPauseTimeMinutes,
        minConversationTimeMinutes: data.minConversationTimeMinutes,
        randomizeInterval: false, // Forçar randomize=false para testar o intervalo de 0-60 segundos
      },
    });

    // Reset de pausas em todas as sessões da campanha
    await this.prisma.warmupCampaignSession.updateMany({
      where: { campaignId },
      data: {
        currentPauseUntil: null,
        lastConversationStart: null,
        conversationStartedAt: null,
      },
    });

    // Informações sobre o teste configurado
    const testInfo = {
      message: 'Sistema de pausas automáticas configurado para teste',
      configuration: {
        enableAutoPauses: data.enableAutoPauses,
        maxPauseTimeMinutes: data.maxPauseTimeMinutes,
        minConversationTimeMinutes: data.minConversationTimeMinutes,
        randomizeInterval: false, // Intervalos de 0-60 segundos quando randomize=false
      },
      campaignInfo: {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        totalSessions: campaign.campaignSessions.length,
      },
      testInstructions: [
        `1. Pausas automáticas: ${data.enableAutoPauses ? 'HABILITADAS' : 'DESABILITADAS'}`,
        `2. Tempo mínimo de conversa antes da pausa: ${data.minConversationTimeMinutes} minutos`,
        `3. Tempo máximo de pausa: ${data.maxPauseTimeMinutes} minutos (será randomizado de 1 a ${data.maxPauseTimeMinutes} min)`,
        '4. Intervalos de mensagem: 0-60 segundos aleatórios (randomize=false)',
        '5. Execute conversas internas para ver o sistema de pausas em ação',
        '6. Monitore os logs para ver quando pausas são aplicadas',
      ],
    };

    return testInfo;
  }

  // 15. Resumo das Últimas Mensagens Enviadas pela Sessão de Aquecimento
  async getSessionRecentMessages(
    sessionId: string, 
    organizationId: string, 
    limit: number = 20, 
    type: 'all' | 'internal' | 'external' = 'all'
  ) {
    // Verificar se a sessão existe e pertence à organização
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        id: sessionId,
        organizationId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Construir filtros baseados no tipo
    let whereCondition: any = {
      fromSessionId: sessionId,
      status: {
        in: ['sent', 'delivered', 'read']
      }
    };

    if (type === 'internal') {
      whereCondition.executionType = 'internal';
    } else if (type === 'external') {
      whereCondition.executionType = 'external';
    }

    // Buscar as execuções recentes
    const recentExecutions = await this.prisma.warmupExecution.findMany({
      where: whereCondition,
      include: {
        campaign: {
          select: {
            name: true,
            id: true,
          }
        },
        template: {
          select: {
            content: true,
            messageType: true,
          }
        },
        toSession: {
          select: {
            name: true,
            phone: true,
          }
        },
        contact: {
          select: {
            name: true,
            phone: true,
          }
        },
        mediaFile: {
          select: {
            fileName: true,
            fileType: true,
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: limit,
    });

    // Calcular estatísticas
    const totalMessages = recentExecutions.length;
    const internalMessages = recentExecutions.filter(e => e.executionType === 'internal').length;
    const externalMessages = recentExecutions.filter(e => e.executionType === 'external').length;
    const deliveredMessages = recentExecutions.filter(e => e.status === 'delivered' || e.status === 'read').length;
    const readMessages = recentExecutions.filter(e => e.status === 'read').length;

    // Agrupar por campanha
    const messagesByCampaign = recentExecutions.reduce((acc, execution) => {
      const campaignId = execution.campaignId;
      if (!acc[campaignId]) {
        acc[campaignId] = {
          campaignName: execution.campaign.name,
          count: 0,
          internal: 0,
          external: 0,
        };
      }
      acc[campaignId].count++;
      if (execution.executionType === 'internal') {
        acc[campaignId].internal++;
      } else {
        acc[campaignId].external++;
      }
      return acc;
    }, {});

    // Mensagens formatadas
    const messages = recentExecutions.map(execution => ({
      id: execution.id,
      campaignName: execution.campaign.name,
      messageContent: execution.messageContent.length > 100 
        ? execution.messageContent.substring(0, 100) + '...' 
        : execution.messageContent,
      messageType: execution.messageType,
      executionType: execution.executionType,
      status: execution.status,
      scheduledAt: execution.scheduledAt,
      sentAt: execution.sentAt,
      deliveredAt: execution.deliveredAt,
      readAt: execution.readAt,
      recipient: execution.executionType === 'internal' 
        ? {
            type: 'session',
            name: execution.toSession?.name,
            phone: execution.toSession?.phone,
          }
        : {
            type: 'contact',
            name: execution.contact?.name,
            phone: execution.contact?.phone,
          },
      template: execution.template ? {
        content: execution.template.content.length > 50 
          ? execution.template.content.substring(0, 50) + '...'
          : execution.template.content,
        type: execution.template.messageType,
      } : null,
      hasMedia: !!execution.mediaFile,
      mediaInfo: execution.mediaFile ? {
        fileName: execution.mediaFile.fileName,
        fileType: execution.mediaFile.fileType,
      } : null,
    }));

    // Últimas 24 horas para contexto adicional
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const last24HoursCount = await this.prisma.warmupExecution.count({
      where: {
        fromSessionId: sessionId,
        status: {
          in: ['sent', 'delivered', 'read']
        },
        sentAt: {
          gte: last24Hours,
        },
      },
    });

    return {
      sessionInfo: {
        id: session.id,
        sessionName: session.name,
        phoneNumber: session.phone,
        status: session.status,
      },
      summary: {
        totalMessages,
        internalMessages,
        externalMessages,
        deliveredMessages,
        readMessages,
        deliveryRate: totalMessages > 0 ? Math.round((deliveredMessages / totalMessages) * 100) : 0,
        readRate: totalMessages > 0 ? Math.round((readMessages / totalMessages) * 100) : 0,
        last24HoursCount,
      },
      messagesByCampaign: Object.values(messagesByCampaign),
      messages,
      filters: {
        limit,
        type,
        appliedFilters: {
          sessionId,
          onlySuccessful: true,
        }
      }
    };
  }

  // Método para marcar mensagens como lidas de uma sessão específica
  async markSessionMessagesAsRead(
    sessionId: string,
    organizationId: string,
    chatId?: string
  ): Promise<{ success: boolean; message: string; results?: any[] }> {
    try {
      // Verificar se a sessão existe e pertence à organização
      const session = await this.prisma.whatsAppSession.findFirst({
        where: {
          sessionId,
          organizationId,
          status: 'CONNECTED'
        }
      });

      if (!session) {
        throw new NotFoundException('Sessão não encontrada ou não conectada');
      }

      if (chatId) {
        // Marcar mensagens como lidas para um chat específico
        const result = await this.whatsappService.markMessagesAsRead(
          sessionId,
          organizationId,
          chatId
        );
        return {
          success: result.success,
          message: result.message,
          results: [result]
        };
      } else {
        // Marcar todas as conversas não lidas como lidas
        const unreadConversations = await this.whatsappService.getUnreadConversations(
          sessionId,
          organizationId
        );

        if (unreadConversations.length === 0) {
          return {
            success: true,
            message: 'Não há conversas não lidas para marcar',
            results: []
          };
        }

        const results: Array<{
          chatId: string;
          unreadCount: number;
          success: boolean;
          message: string;
        }> = [];
        
        for (const conversation of unreadConversations) {
          const result = await this.whatsappService.markMessagesAsRead(
            sessionId,
            organizationId,
            conversation.chatId
          );
          results.push({
            chatId: conversation.chatId,
            unreadCount: conversation.unreadCount,
            success: result.success,
            message: result.message
          });
        }

        const successCount = results.filter(r => r.success).length;
        return {
          success: successCount === results.length,
          message: `${successCount}/${results.length} conversas marcadas como lidas`,
          results
        };
      }
    } catch (error) {
      this.logger.error(`Erro ao marcar mensagens como lidas: ${error.message}`);
      throw error;
    }
  }

  // Método para obter conversas não lidas de uma sessão
  async getSessionUnreadConversations(
    sessionId: string,
    organizationId: string
  ): Promise<Array<{ chatId: string; unreadCount: number }>> {
    try {
      // Verificar se a sessão existe e pertence à organização
      const session = await this.prisma.whatsAppSession.findFirst({
        where: {
          sessionId,
          organizationId,
          status: 'CONNECTED'
        }
      });

      if (!session) {
        throw new NotFoundException('Sessão não encontrada ou não conectada');
      }

      return await this.whatsappService.getUnreadConversations(sessionId, organizationId);
    } catch (error) {
      this.logger.error(`Erro ao obter conversas não lidas: ${error.message}`);
      throw error;
    }
  }

  // NOVOS MÉTODOS PARA CONFIGURAÇÃO DE AUTO-READ POR SESSÃO DE AQUECIMENTO
  async getWarmupSessionAutoReadSettings(
    campaignId: string,
    sessionId: string,
    organizationId: string
  ): Promise<{
    campaignId: string;
    campaignName: string;
    sessionId: string;
    sessionName: string;
    autoReadEnabled: boolean;
    autoReadInterval: number;
    autoReadMinDelay: number;
    autoReadMaxDelay: number;
  }> {
    try {
      const warmupSession = await this.prisma.warmupCampaignSession.findFirst({
        where: {
          campaignId,
          session: {
            sessionId, // Buscar pela sessionId da WhatsApp, não pelo ID da tabela
            organizationId
          },
          campaign: {
            organizationId
          }
        },
        include: {
          session: true,
          campaign: true
        }
      });

      if (!warmupSession) {
        throw new NotFoundException('Sessão de aquecimento não encontrada');
      }

      return {
        campaignId: warmupSession.campaignId,
        campaignName: warmupSession.campaign.name,
        sessionId: warmupSession.session.sessionId,
        sessionName: warmupSession.session.name,
        autoReadEnabled: warmupSession.autoReadEnabled || false,
        autoReadInterval: warmupSession.autoReadInterval || 300,
        autoReadMinDelay: warmupSession.autoReadMinDelay || 5,
        autoReadMaxDelay: warmupSession.autoReadMaxDelay || 30
      };
    } catch (error) {
      this.logger.error(`Erro ao obter configurações de auto-read da sessão de aquecimento: ${error.message}`);
      throw error;
    }
  }

  async updateWarmupSessionAutoReadSettings(
    campaignId: string,
    sessionId: string,
    organizationId: string,
    updateData: {
      autoReadEnabled?: boolean;
      autoReadInterval?: number;
      autoReadMinDelay?: number;
      autoReadMaxDelay?: number;
    }
  ): Promise<{
    campaignId: string;
    campaignName: string;
    sessionId: string;
    sessionName: string;
    autoReadEnabled: boolean;
    autoReadInterval: number;
    autoReadMinDelay: number;
    autoReadMaxDelay: number;
    message: string;
  }> {
    try {
      // Validações
      if (updateData.autoReadMinDelay && updateData.autoReadMaxDelay && 
          updateData.autoReadMinDelay >= updateData.autoReadMaxDelay) {
        throw new BadRequestException('Delay mínimo deve ser menor que o delay máximo');
      }

      const warmupSession = await this.prisma.warmupCampaignSession.findFirst({
        where: {
          campaignId,
          session: {
            sessionId, // Buscar pela sessionId da WhatsApp, não pelo ID da tabela
            organizationId
          },
          campaign: {
            organizationId
          }
        }
      });

      if (!warmupSession) {
        throw new NotFoundException('Sessão de aquecimento não encontrada');
      }

      const updatedWarmupSession = await this.prisma.warmupCampaignSession.update({
        where: {
          id: warmupSession.id
        },
        data: updateData,
        include: {
          session: true,
          campaign: true
        }
      });

      return {
        campaignId: updatedWarmupSession.campaignId,
        campaignName: updatedWarmupSession.campaign.name,
        sessionId: updatedWarmupSession.session.sessionId,
        sessionName: updatedWarmupSession.session.name,
        autoReadEnabled: updatedWarmupSession.autoReadEnabled,
        autoReadInterval: updatedWarmupSession.autoReadInterval,
        autoReadMinDelay: updatedWarmupSession.autoReadMinDelay,
        autoReadMaxDelay: updatedWarmupSession.autoReadMaxDelay,
        message: 'Configurações de auto-read da sessão de aquecimento atualizadas com sucesso'
      };
    } catch (error) {
      this.logger.error(`Erro ao atualizar configurações de auto-read da sessão de aquecimento: ${error.message}`);
      throw error;
    }
  }

  async toggleWarmupSessionAutoRead(
    campaignId: string,
    sessionId: string,
    organizationId: string,
    enabled: boolean
  ): Promise<{
    campaignId: string;
    campaignName: string;
    sessionId: string;
    sessionName: string;
    autoReadEnabled: boolean;
    message: string;
  }> {
    try {
      const warmupSession = await this.prisma.warmupCampaignSession.findFirst({
        where: {
          campaignId,
          session: {
            sessionId, // Buscar pela sessionId da WhatsApp, não pelo ID da tabela
            organizationId
          },
          campaign: {
            organizationId
          }
        },
        include: {
          session: true,
          campaign: true
        }
      });

      if (!warmupSession) {
        throw new NotFoundException('Sessão de aquecimento não encontrada');
      }

      const updatedWarmupSession = await this.prisma.warmupCampaignSession.update({
        where: {
          id: warmupSession.id
        },
        data: {
          autoReadEnabled: enabled
        },
        include: {
          session: true,
          campaign: true
        }
      });

      return {
        campaignId: updatedWarmupSession.campaignId,
        campaignName: updatedWarmupSession.campaign.name,
        sessionId: updatedWarmupSession.session.sessionId,
        sessionName: updatedWarmupSession.session.name,
        autoReadEnabled: updatedWarmupSession.autoReadEnabled,
        message: `Auto-read ${enabled ? 'ativado' : 'desativado'} com sucesso para a sessão ${updatedWarmupSession.session.name} na campanha ${updatedWarmupSession.campaign.name}`
      };
    } catch (error) {
      this.logger.error(`Erro ao ${enabled ? 'ativar' : 'desativar'} auto-read da sessão de aquecimento: ${error.message}`);
      throw error;
    }
  }

  async getCampaignAutoReadStatus(campaignId: string, organizationId: string): Promise<{
    campaignId: string;
    campaignName: string;
    totalSessions: number;
    sessionsAutoReadEnabled: number;
    percentageEnabled: number;
    sessions: Array<{
      sessionId: string;
      sessionName: string;
      autoReadEnabled: boolean;
      autoReadInterval: number;
      autoReadMinDelay: number;
      autoReadMaxDelay: number;
    }>;
  }> {
    try {
      const campaign = await this.prisma.warmupCampaign.findFirst({
        where: {
          id: campaignId,
          organizationId
        },
        include: {
          campaignSessions: {
            include: {
              session: true
            }
          }
        }
      });

      if (!campaign) {
        throw new NotFoundException('Campanha de aquecimento não encontrada');
      }

      const totalSessions = campaign.campaignSessions.length;
      const sessionsAutoReadEnabled = campaign.campaignSessions.filter(s => s.autoReadEnabled).length;

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        totalSessions,
        sessionsAutoReadEnabled,
        percentageEnabled: totalSessions > 0 ? (sessionsAutoReadEnabled / totalSessions) * 100 : 0,
        sessions: campaign.campaignSessions.map(warmupSession => ({
          sessionId: warmupSession.session.sessionId,
          sessionName: warmupSession.session.name,
          autoReadEnabled: warmupSession.autoReadEnabled,
          autoReadInterval: warmupSession.autoReadInterval,
          autoReadMinDelay: warmupSession.autoReadMinDelay,
          autoReadMaxDelay: warmupSession.autoReadMaxDelay
        }))
      };
    } catch (error) {
      this.logger.error(`Erro ao obter status de auto-read da campanha: ${error.message}`);
      throw error;
    }
  }
}

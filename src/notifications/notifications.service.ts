import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

export interface SessionDisconnectedData {
  sessionId: string;
  sessionName: string;
  phone?: string;
  campaignIds?: string[];
  disconnectedAt: Date;
  reason?: string;
}

export interface WarmupProgressData {
  campaignId: string;
  campaignName: string;
  sessionId: string;
  sessionName: string;
  progress: {
    dailyMessagesSent: number;
    dailyGoal: number;
    totalMessagesSent: number;
    successRate: number;
    healthScore: number;
  };
  lastExecution?: {
    contactName: string;
    contactPhone: string;
    messageContent: string;
    executedAt: Date;
    status: string;
  };
}

export interface WarmupExecutionData {
  campaignId: string;
  campaignName: string;
  sessionId: string;
  sessionName: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  messageContent: string;
  messageType: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduledAt: Date;
  executedAt?: Date;
  errorMessage?: string;
}

export interface HealthUpdateData {
  campaignId: string;
  campaignName: string;
  sessionId: string;
  sessionName: string;
  phone: string;
  previousHealth: number;
  currentHealth: number;
  healthChange: number;
  metrics: {
    messagesSent: number;
    messagesDelivered: number;
    messagesRead: number;
    responsesReceived: number;
    averageMessagesPerHour: number;
  };
  calculatedAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  // Notificar quando uma sessão WhatsApp desconecta
  notifySessionDisconnected(organizationId: string, data: SessionDisconnectedData) {
    this.notificationsGateway.notifySessionDisconnected(organizationId, {
      id: data.sessionId,
      name: data.sessionName,
      phone: data.phone,
      campaignIds: data.campaignIds,
      disconnectedAt: data.disconnectedAt,
      reason: data.reason,
    });

    // Log para auditoria
    console.log(`[NOTIFICATION] Sessão desconectada: ${data.sessionName} (${data.sessionId}) - Org: ${organizationId}`);
  }

  // Notificar progresso do aquecimento
  notifyWarmupProgress(organizationId: string, data: WarmupProgressData) {
    this.notificationsGateway.notifyWarmupProgress(organizationId, data);

    // Log para auditoria
    console.log(`[NOTIFICATION] Progresso aquecimento: ${data.campaignName} - ${data.progress.dailyMessagesSent}/${data.progress.dailyGoal} mensagens`);
  }

  // Notificar execução de mensagem de aquecimento
  notifyWarmupExecution(organizationId: string, data: WarmupExecutionData) {
    this.notificationsGateway.notifyWarmupExecution(organizationId, data);

    // Log para auditoria
    console.log(`[NOTIFICATION] Execução aquecimento: ${data.campaignName} -> ${data.contactName} (${data.status})`);
  }

  // Notificar atualização de saúde do número
  notifyHealthUpdate(organizationId: string, data: HealthUpdateData) {
    // Só notificar se houve mudança significativa (mais de 5 pontos)
    if (Math.abs(data.healthChange) >= 5) {
      this.notificationsGateway.notifyHealthUpdate(organizationId, data);

      // Log para auditoria
      const trend = data.healthChange > 0 ? 'melhorou' : 'piorou';
      console.log(`[NOTIFICATION] Saúde ${trend}: ${data.sessionName} - ${data.previousHealth}% → ${data.currentHealth}%`);
    }
  }

  // Notificar múltiplas desconexões (alerta crítico)
  notifyMultipleDisconnections(organizationId: string, disconnectedSessions: SessionDisconnectedData[]) {
    const notification = {
      type: 'multiple_disconnections',
      data: {
        count: disconnectedSessions.length,
        sessions: disconnectedSessions.map(s => ({
          sessionId: s.sessionId,
          sessionName: s.sessionName,
          phone: s.phone,
        })),
        timestamp: new Date(),
      },
      severity: 'critical',
    };

    this.notificationsGateway.sendNotification(organizationId, 'multiple_disconnections', notification);
  }

  // Notificar baixa performance de aquecimento
  notifyLowWarmupPerformance(organizationId: string, campaignData: any) {
    const notification = {
      type: 'low_warmup_performance',
      data: campaignData,
      severity: 'warning',
      timestamp: new Date(),
    };

    this.notificationsGateway.sendNotification(organizationId, 'low_warmup_performance', notification);
  }

  // Notificar limite diário atingido
  notifyDailyLimitReached(organizationId: string, campaignData: any) {
    const notification = {
      type: 'daily_limit_reached',
      data: {
        campaignId: campaignData.campaignId,
        campaignName: campaignData.campaignName,
        sessionId: campaignData.sessionId,
        sessionName: campaignData.sessionName,
        messagesSent: campaignData.messagesSent,
        dailyGoal: campaignData.dailyGoal,
        reachedAt: new Date(),
      },
      severity: 'info',
      timestamp: new Date(),
    };

    this.notificationsGateway.sendNotification(organizationId, 'daily_limit_reached', notification);
  }

  // Enviar notificação customizada
  sendCustomNotification(organizationId: string, event: string, data: any) {
    this.notificationsGateway.sendNotification(organizationId, event, data);
  }

  // Obter estatísticas de conexões
  getConnectionStats() {
    return this.notificationsGateway.getConnectionStats();
  }

  // Teste de conectividade
  testConnection(organizationId: string) {
    const testData = {
      message: 'Teste de conectividade WebSocket',
      timestamp: new Date(),
      organizationId,
    };

    this.notificationsGateway.sendNotification(organizationId, 'test_connection', testData);
    return testData;
  }

  // ==================== NOVOS MÉTODOS PARA LOGS DE CAMPANHA ====================

  // Logs de campanha com diferentes níveis
  logCampaignInfo(organizationId: string, campaignId: string, campaignName: string, message: string, details?: any, sessionId?: string, sessionName?: string) {
    this.notificationsGateway.logCampaignInfo(organizationId, campaignId, campaignName, message, details, sessionId, sessionName);
  }

  logCampaignWarning(organizationId: string, campaignId: string, campaignName: string, message: string, details?: any, sessionId?: string, sessionName?: string) {
    this.notificationsGateway.logCampaignWarning(organizationId, campaignId, campaignName, message, details, sessionId, sessionName);
  }

  logCampaignError(organizationId: string, campaignId: string, campaignName: string, message: string, details?: any, sessionId?: string, sessionName?: string) {
    this.notificationsGateway.logCampaignError(organizationId, campaignId, campaignName, message, details, sessionId, sessionName);
  }

  logCampaignSuccess(organizationId: string, campaignId: string, campaignName: string, message: string, details?: any, sessionId?: string, sessionName?: string) {
    this.notificationsGateway.logCampaignSuccess(organizationId, campaignId, campaignName, message, details, sessionId, sessionName);
  }

  // Notificar status da campanha
  notifyCampaignStatus(organizationId: string, campaignId: string, campaignName: string, status: 'active' | 'paused' | 'stopped' | 'waiting', reason?: string, nextExecution?: Date, messagesInQueue?: number, activeSessions?: number) {
    this.notificationsGateway.notifyCampaignStatus(organizationId, {
      campaignId,
      campaignName,
      status,
      reason,
      nextExecution,
      messagesInQueue: messagesInQueue || 0,
      activeSeessions: activeSessions || 0,
    });
  }

  // Notificar saúde do bot
  notifyBotHealth(organizationId: string, sessionId: string, sessionName: string, campaignId: string, campaignName: string, healthScore: number, deliveryRate: number, messagesPerDay: number, lastActivity: Date) {
    const status = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : healthScore >= 30 ? 'critical' : 'offline';
    
    this.notificationsGateway.notifyBotHealth(organizationId, {
      sessionId,
      sessionName,
      campaignId,
      campaignName,
      healthScore,
      status,
      lastActivity,
      deliveryRate,
      messagesPerDay,
    });
  }

  // Notificar log de execução detalhado
  notifyExecutionLog(organizationId: string, executionId: string, campaignId: string, campaignName: string, sessionId: string, sessionName: string, type: 'internal' | 'external', status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'delivered', targetContact?: string, targetSession?: string, messageContent?: string, scheduledAt?: Date, executedAt?: Date, errorMessage?: string) {
    this.notificationsGateway.notifyExecutionLog(organizationId, {
      executionId,
      campaignId,
      campaignName,
      sessionId,
      sessionName,
      type,
      status,
      targetContact,
      targetSession,
      messageContent: messageContent || '',
      scheduledAt: scheduledAt || new Date(),
      executedAt,
      errorMessage,
    });
  }
}

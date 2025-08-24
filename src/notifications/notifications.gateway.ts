import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export interface NotificationData {
  type: 'session_disconnected' | 'warmup_progress' | 'warmup_execution' | 'health_update' | 'multiple_disconnections' | 'daily_limit_reached' | 'campaign_log' | 'campaign_status' | 'bot_health' | 'execution_log';
  data: any;
  timestamp: Date;
  organizationId: string;
}

export interface CampaignLogData {
  campaignId: string;
  campaignName: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
  sessionId?: string;
  sessionName?: string;
  timestamp: Date;
}

export interface CampaignStatusData {
  campaignId: string;
  campaignName: string;
  status: 'active' | 'paused' | 'stopped' | 'waiting';
  reason?: string;
  nextExecution?: Date;
  messagesInQueue: number;
  activeSeessions: number;
}

export interface BotHealthData {
  sessionId: string;
  sessionName: string;
  campaignId: string;
  campaignName: string;
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  lastActivity: Date;
  deliveryRate: number;
  messagesPerDay: number;
}

export interface ExecutionLogData {
  executionId: string;
  campaignId: string;
  campaignName: string;
  sessionId: string;
  sessionName: string;
  type: 'internal' | 'external';
  status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'delivered';
  targetContact?: string;
  targetSession?: string;
  messageContent: string;
  scheduledAt: Date;
  executedAt?: Date;
  errorMessage?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket[]>(); // organizationId -> sockets

  async handleConnection(client: Socket) {
    try {
      // Extrair dados de autenticação do token ou query params
      const token = client.handshake.auth.token || client.handshake.query.token;
      const organizationId = client.handshake.auth.organizationId || client.handshake.query.organizationId;

      if (!token || !organizationId) {
        client.disconnect();
        return;
      }

      // Adicionar socket ao mapa da organização
      if (!this.userSockets.has(organizationId)) {
        this.userSockets.set(organizationId, []);
      }
      this.userSockets.get(organizationId)!.push(client);

      // Adicionar organizationId ao socket para uso posterior
      client.data.organizationId = organizationId;

      console.log(`Cliente conectado: ${client.id} (Org: ${organizationId})`);
      
      // Confirmar conexão
      client.emit('connected', {
        message: 'Conectado com sucesso ao sistema de notificações',
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('Erro na conexão WebSocket:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const organizationId = client.data.organizationId;
    
    if (organizationId && this.userSockets.has(organizationId)) {
      const sockets = this.userSockets.get(organizationId)!;
      const index = sockets.findIndex(s => s.id === client.id);
      
      if (index !== -1) {
        sockets.splice(index, 1);
        
        // Remover organização se não há mais sockets
        if (sockets.length === 0) {
          this.userSockets.delete(organizationId);
        }
      }
    }

    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.join(data.room);
    client.emit('joined_room', { room: data.room });
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    client.leave(data.room);
    client.emit('left_room', { room: data.room });
  }

  // Métodos para enviar notificações

  // Notificar desconexão de sessão WhatsApp
  notifySessionDisconnected(organizationId: string, sessionData: any) {
    const notification: NotificationData = {
      type: 'session_disconnected',
      data: {
        sessionId: sessionData.id,
        sessionName: sessionData.name,
        phone: sessionData.phone,
        disconnectedAt: new Date(),
      },
      timestamp: new Date(),
      organizationId,
    };

    this.sendToOrganization(organizationId, 'session_disconnected', notification);
  }

  // Notificar progresso do aquecimento
  notifyWarmupProgress(organizationId: string, campaignData: any) {
    const notification: NotificationData = {
      type: 'warmup_progress',
      data: campaignData,
      timestamp: new Date(),
      organizationId,
    };

    this.sendToOrganization(organizationId, 'warmup_progress', notification);
  }

  // Notificar execução de mensagem de aquecimento
  notifyWarmupExecution(organizationId: string, executionData: any) {
    const notification: NotificationData = {
      type: 'warmup_execution',
      data: executionData,
      timestamp: new Date(),
      organizationId,
    };

    this.sendToOrganization(organizationId, 'warmup_execution', notification);
  }

  // Notificar atualização de saúde do número
  notifyHealthUpdate(organizationId: string, healthData: any) {
    const notification: NotificationData = {
      type: 'health_update',
      data: healthData,
      timestamp: new Date(),
      organizationId,
    };

    this.sendToOrganization(organizationId, 'health_update', notification);
  }

  // Notificar múltiplas desconexões
  notifyMultipleDisconnections(organizationId: string, disconnectionData: any) {
    const notification: NotificationData = {
      type: 'multiple_disconnections',
      data: disconnectionData,
      timestamp: new Date(),
      organizationId,
    };

    this.sendToOrganization(organizationId, 'multiple_disconnections', notification);
  }

  // Notificar limite diário atingido
  notifyDailyLimitReached(organizationId: string, limitData: any) {
    const notification: NotificationData = {
      type: 'daily_limit_reached',
      data: limitData,
      timestamp: new Date(),
      organizationId,
    };

    this.sendToOrganization(organizationId, 'daily_limit_reached', notification);
  }

  // ==================== NOVOS MÉTODOS PARA LOGS DE CAMPANHA ====================

  // Enviar log de campanha
  sendCampaignLog(organizationId: string, logData: CampaignLogData) {
    const notification: NotificationData = {
      type: 'campaign_log',
      data: logData,
      timestamp: new Date(),
      organizationId,
    };

    this.sendToOrganization(organizationId, 'campaign_log', notification);
    
    // Log para console também
    const logLevel = logData.level.toUpperCase();
    const sessionInfo = logData.sessionName ? ` [${logData.sessionName}]` : '';
    console.log(`[${logLevel}] ${logData.campaignName}${sessionInfo}: ${logData.message}`);
  }

  // Notificar mudança de status da campanha
  notifyCampaignStatus(organizationId: string, statusData: CampaignStatusData) {
    const notification: NotificationData = {
      type: 'campaign_status',
      data: statusData,
      timestamp: new Date(),
      organizationId,
    };

    this.sendToOrganization(organizationId, 'campaign_status', notification);
  }

  // Notificar saúde do bot em tempo real
  notifyBotHealth(organizationId: string, healthData: BotHealthData) {
    const notification: NotificationData = {
      type: 'bot_health',
      data: healthData,
      timestamp: new Date(),
      organizationId,
    };

    this.sendToOrganization(organizationId, 'bot_health', notification);
  }

  // Notificar log de execução detalhado
  notifyExecutionLog(organizationId: string, executionData: ExecutionLogData) {
    const notification: NotificationData = {
      type: 'execution_log',
      data: executionData,
      timestamp: new Date(),
      organizationId,
    };

    this.sendToOrganization(organizationId, 'execution_log', notification);
  }

  // ==================== MÉTODOS UTILITÁRIOS ====================

  // Enviar logs de campanha com diferentes níveis
  logCampaignInfo(organizationId: string, campaignId: string, campaignName: string, message: string, details?: any, sessionId?: string, sessionName?: string) {
    this.sendCampaignLog(organizationId, {
      campaignId,
      campaignName,
      level: 'info',
      message,
      details,
      sessionId,
      sessionName,
      timestamp: new Date(),
    });
  }

  logCampaignWarning(organizationId: string, campaignId: string, campaignName: string, message: string, details?: any, sessionId?: string, sessionName?: string) {
    this.sendCampaignLog(organizationId, {
      campaignId,
      campaignName,
      level: 'warning',
      message,
      details,
      sessionId,
      sessionName,
      timestamp: new Date(),
    });
  }

  logCampaignError(organizationId: string, campaignId: string, campaignName: string, message: string, details?: any, sessionId?: string, sessionName?: string) {
    this.sendCampaignLog(organizationId, {
      campaignId,
      campaignName,
      level: 'error',
      message,
      details,
      sessionId,
      sessionName,
      timestamp: new Date(),
    });
  }

  logCampaignSuccess(organizationId: string, campaignId: string, campaignName: string, message: string, details?: any, sessionId?: string, sessionName?: string) {
    this.sendCampaignLog(organizationId, {
      campaignId,
      campaignName,
      level: 'success',
      message,
      details,
      sessionId,
      sessionName,
      timestamp: new Date(),
    });
  }

  // Enviar dashboard completo para cliente recém conectado
  @SubscribeMessage('request_dashboard')
  async handleDashboardRequest(@ConnectedSocket() client: Socket) {
    const organizationId = client.data.organizationId;
    
    if (!organizationId) {
      client.emit('error', { message: 'Organização não identificada' });
      return;
    }

    try {
      // Aqui você pode buscar dados atuais do dashboard
      // Por enquanto, enviamos confirmação
      client.emit('dashboard_data', {
        message: 'Dashboard atualizado',
        timestamp: new Date(),
        organizationId,
      });
    } catch (error) {
      client.emit('error', { message: 'Erro ao carregar dashboard', error: error.message });
    }
  }

  // Método para verificar status de conectividade
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date() });
  }

  // Método genérico para enviar notificações
  sendNotification(organizationId: string, event: string, data: any) {
    this.sendToOrganization(organizationId, event, data);
  }

  // Método privado para enviar para uma organização
  private sendToOrganization(organizationId: string, event: string, data: any) {
    const sockets = this.userSockets.get(organizationId);
    
    if (sockets && sockets.length > 0) {
      sockets.forEach(socket => {
        socket.emit(event, data);
      });
      
      console.log(`Notificação enviada para ${sockets.length} cliente(s) da organização ${organizationId}: ${event}`);
    }
  }

  // Método para enviar para uma sala específica
  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  // Método para broadcast geral (cuidado com uso)
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Método para obter estatísticas de conexões
  getConnectionStats() {
    const stats = {
      totalConnections: 0,
      organizationsConnected: this.userSockets.size,
      connectionsByOrg: {} as Record<string, number>,
    };

    this.userSockets.forEach((sockets, orgId) => {
      stats.totalConnections += sockets.length;
      stats.connectionsByOrg[orgId] = sockets.length;
    });

    return stats;
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CanReadSessions } from '../auth/decorators/permissions.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Get('stats')
  @CanReadSessions()
  @ApiOperation({ summary: 'Obter estatísticas de conexões WebSocket' })
  getConnectionStats() {
    return this.notificationsService.getConnectionStats();
  }

  @Post('test')
  @CanReadSessions()
  @ApiOperation({ summary: 'Testar conexão WebSocket básica' })
  testConnection(@Request() req) {
    return this.notificationsService.testConnection(req.user.organizationId);
  }

  @Post('custom')
  @CanReadSessions()
  @ApiOperation({ summary: 'Enviar notificação personalizada' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        event: { type: 'string', example: 'custom_event' },
        data: { type: 'object', example: { message: 'Notificação personalizada' } }
      }
    }
  })
  sendCustomNotification(
    @Request() req,
    @Body() body: { event: string; data: any },
  ) {
    return this.notificationsService.sendCustomNotification(
      req.user.organizationId,
      body.event,
      body.data,
    );
  }

  @Post('test-session-disconnected')
  @CanReadSessions()
  @ApiOperation({ summary: 'Testar notificação de sessão desconectada' })
  async testSessionDisconnected(@Request() req) {
    const organizationId = req.user.organizationId;
    
    const testData = {
      sessionId: 'test_session_123',
      sessionName: 'Teste WhatsApp',
      phone: '+5511999999999',
      reason: 'Teste de desconexão',
      campaignIds: ['campaign_1', 'campaign_2'],
      timestamp: new Date().toISOString(),
    };

    this.notificationsGateway.notifySessionDisconnected(organizationId, testData);
    
    return {
      success: true,
      message: 'Notificação de sessão desconectada enviada',
      data: testData,
    };
  }

  @Post('test-warmup-progress')
  @CanReadSessions()
  @ApiOperation({ summary: 'Testar notificação de progresso de aquecimento' })
  async testWarmupProgress(@Request() req) {
    const organizationId = req.user.organizationId;
    
    const testData = {
      campaignId: 'campaign_test_123',
      campaignName: 'Campanha de Teste',
      sessionId: 'session_test_123',
      sessionName: 'WhatsApp Teste',
      progress: {
        dailyMessagesSent: 25,
        dailyGoal: 50,
        healthScore: 85.5,
        completionPercentage: 50,
      },
      timestamp: new Date().toISOString(),
    };

    this.notificationsGateway.notifyWarmupProgress(organizationId, testData);
    
    return {
      success: true,
      message: 'Notificação de progresso de aquecimento enviada',
      data: testData,
    };
  }

  @Post('test-warmup-execution')
  @CanReadSessions()
  @ApiOperation({ summary: 'Testar notificação de execução de aquecimento' })
  async testWarmupExecution(@Request() req) {
    const organizationId = req.user.organizationId;
    
    const testData = {
      executionId: 'exec_test_123',
      campaignId: 'campaign_test_123',
      campaignName: 'Campanha de Teste',
      contactId: 'contact_test_123',
      contactName: 'João da Silva',
      contactPhone: '+5511888888888',
      messageContent: 'Olá! Como você está? Espero que esteja tudo bem!',
      status: 'sent',
      timestamp: new Date().toISOString(),
    };

    this.notificationsGateway.notifyWarmupExecution(organizationId, testData);
    
    return {
      success: true,
      message: 'Notificação de execução de aquecimento enviada',
      data: testData,
    };
  }

  @Post('test-health-update')
  @CanReadSessions()
  @ApiOperation({ summary: 'Testar notificação de atualização de saúde' })
  async testHealthUpdate(@Request() req) {
    const organizationId = req.user.organizationId;
    
    const testData = {
      sessionId: 'session_test_123',
      sessionName: 'WhatsApp Teste',
      phone: '+5511999999999',
      previousHealth: 75.0,
      currentHealth: 82.5,
      healthChange: 7.5,
      metrics: {
        responseRate: 85,
        messageDeliveryRate: 95,
        onlineTime: 90,
        errorRate: 5,
      },
      timestamp: new Date().toISOString(),
    };

    this.notificationsGateway.notifyHealthUpdate(organizationId, testData);
    
    return {
      success: true,
      message: 'Notificação de atualização de saúde enviada',
      data: testData,
    };
  }

  @Post('test-multiple-disconnections')
  @CanReadSessions()
  @ApiOperation({ summary: 'Testar notificação de múltiplas desconexões' })
  async testMultipleDisconnections(@Request() req) {
    const organizationId = req.user.organizationId;
    
    const testData = {
      count: 5,
      sessions: [
        { sessionId: 'session_1', phone: '+5511111111111' },
        { sessionId: 'session_2', phone: '+5511222222222' },
        { sessionId: 'session_3', phone: '+5511333333333' },
        { sessionId: 'session_4', phone: '+5511444444444' },
        { sessionId: 'session_5', phone: '+5511555555555' },
      ],
      reason: 'Instabilidade na conexão de internet',
      timestamp: new Date().toISOString(),
    };

    this.notificationsGateway.notifyMultipleDisconnections(organizationId, testData);
    
    return {
      success: true,
      message: 'Notificação de múltiplas desconexões enviada',
      data: testData,
    };
  }

  @Post('test-daily-limit')
  @CanReadSessions()
  @ApiOperation({ summary: 'Testar notificação de limite diário atingido' })
  async testDailyLimit(@Request() req) {
    const organizationId = req.user.organizationId;
    
    const testData = {
      campaignId: 'campaign_test_123',
      campaignName: 'Campanha de Teste',
      sessionId: 'session_test_123',
      sessionName: 'WhatsApp Teste',
      dailyGoal: 100,
      messagesSent: 100,
      nextExecutionTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      timestamp: new Date().toISOString(),
    };

    this.notificationsGateway.notifyDailyLimitReached(organizationId, testData);
    
    return {
      success: true,
      message: 'Notificação de limite diário atingido enviada',
      data: testData,
    };
  }
}

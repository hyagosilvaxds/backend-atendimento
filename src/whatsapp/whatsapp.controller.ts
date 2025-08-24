import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WhatsAppService, SessionInfo } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreateWhatsAppSessionDto, SendMessageDto } from './dto/whatsapp.dto';
import { PermissionAction, PermissionResource } from '@prisma/client';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Post('sessions')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.WHATSAPP_SESSIONS })
  async createSession(
    @Request() req,
    @Body() createSessionDto: CreateWhatsAppSessionDto,
  ): Promise<SessionInfo> {
    const { id: userId, organizationId } = req.user;
    return this.whatsAppService.createSession(userId, organizationId, createSessionDto);
  }

  @Get('sessions')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.WHATSAPP_SESSIONS })
  async getSessions(@Request() req): Promise<SessionInfo[]> {
    const { organizationId } = req.user;
    return this.whatsAppService.getSessionsByOrganization(organizationId);
  }

  @Get('sessions/:sessionId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.WHATSAPP_SESSIONS })
  async getSession(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ): Promise<SessionInfo> {
    const { organizationId } = req.user;
    return this.whatsAppService.getSessionById(sessionId, organizationId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.WHATSAPP_SESSIONS })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    const { organizationId } = req.user;
    return this.whatsAppService.deleteSession(sessionId, organizationId);
  }

  @Get('sessions/:sessionId/qr')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.WHATSAPP_SESSIONS })
  async getQRCode(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ): Promise<{ qrCode: string | null }> {
    const { organizationId } = req.user;
    const qrCode = await this.whatsAppService.getQRCode(sessionId, organizationId);
    return { qrCode };
  }

  @Post('sessions/:sessionId/send')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.MESSAGES })
  async sendMessage(
    @Request() req,
    @Param('sessionId') sessionId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<any> {
    const { organizationId } = req.user;
    const { to, message } = sendMessageDto;
    return this.whatsAppService.sendMessage(sessionId, organizationId, to, message);
  }

  @Post('sessions/:sessionId/disconnect')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.WHATSAPP_SESSIONS })
  async disconnectSession(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ): Promise<{ message: string; status: string }> {
    const { organizationId } = req.user;
    return this.whatsAppService.disconnectSession(sessionId, organizationId);
  }

  @Post('sessions/:sessionId/connect')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.WHATSAPP_SESSIONS })
  async reconnectSession(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ): Promise<{ message: string; status: string }> {
    const { organizationId } = req.user;
    return this.whatsAppService.reconnectSession(sessionId, organizationId);
  }

  @Post('sessions/:sessionId/qr/refresh')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.WHATSAPP_SESSIONS })
  async refreshQRCode(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ): Promise<{ message: string; status: string }> {
    const { organizationId } = req.user;
    return this.whatsAppService.refreshQRCode(sessionId, organizationId);
  }

  @Get('sessions/:sessionId/status')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.WHATSAPP_SESSIONS })
  async getSessionStatus(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ): Promise<{
    status: string;
    qrCodeReady: boolean;
    connected: boolean;
    phone?: string;
    lastUpdate: Date;
    timestamp: number;
  }> {
    const { organizationId } = req.user;
    return this.whatsAppService.getSessionStatus(sessionId, organizationId);
  }
}

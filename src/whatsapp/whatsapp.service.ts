import { Injectable, Logger, OnModuleInit, OnModuleDestroy, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import makeWASocket, { 
  DisconnectReason, 
  ConnectionState,
  useMultiFileAuthState,
  WASocket,
  BaileysEventMap,
  proto,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import { WhatsAppSessionStatus, WhatsAppSessionType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import P from 'pino';

export interface CreateSessionDto {
  name: string;
  type?: WhatsAppSessionType;
  webhookUrl?: string;
}

export interface SessionInfo {
  id: string;
  name: string;
  sessionId: string;
  phone?: string;
  qrCode?: string;
  status: WhatsAppSessionStatus;
  type: WhatsAppSessionType;
  isActive: boolean;
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
  createdAt: Date;
}

@Injectable()
export class WhatsAppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly sessions = new Map<string, WASocket>();
  private readonly authDir = path.join(process.cwd(), 'whatsapp-auth');

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    // Criar diretório de autenticação se não existir
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  /**
   * Função utilitária para limpar o chatId removendo a parte :XX antes do @
   * Exemplo: 553898817400:18@s.whatsapp.net -> 553898817400@s.whatsapp.net
   */
  private cleanChatId(chatId: string): string {
    if (!chatId) return chatId;
    
    // Se contém ':' antes do '@', remove tudo entre ':' e '@'
    if (chatId.includes(':') && chatId.includes('@')) {
      const parts = chatId.split('@');
      if (parts.length === 2) {
        const beforeAt = parts[0];
        const afterAt = parts[1];
        
        // Se há ':' na primeira parte, remove tudo a partir do ':'
        if (beforeAt.includes(':')) {
          const cleanBeforeAt = beforeAt.split(':')[0];
          return `${cleanBeforeAt}@${afterAt}`;
        }
      }
    }
    
    return chatId;
  }

  async onModuleInit() {
    this.logger.log('Inicializando módulo WhatsApp...');
    await this.checkAndFixInconsistentSessions();
    await this.autoConnectAllSessions();
  }

  /**
   * Verifica e corrige sessões inconsistentes na inicialização
   * Sessões marcadas como CONNECTED no banco mas não estão realmente conectadas
   */
  private async checkAndFixInconsistentSessions(): Promise<void> {
    try {
      this.logger.log('Verificando sessões inconsistentes...');
      
      // Buscar todas as sessões que estão marcadas como conectadas
      const connectedSessions = await this.prisma.whatsAppSession.findMany({
        where: {
          status: {
            in: [WhatsAppSessionStatus.CONNECTED, WhatsAppSessionStatus.QR_CODE]
          }
        }
      });

      if (connectedSessions.length === 0) {
        this.logger.log('Nenhuma sessão inconsistente encontrada.');
        return;
      }

      this.logger.log(`Encontradas ${connectedSessions.length} sessões que podem estar inconsistentes.`);

      // Atualizar todas essas sessões para DISCONNECTED
      // pois após reinício do servidor, as conexões em memória foram perdidas
      const updateResult = await this.prisma.whatsAppSession.updateMany({
        where: {
          status: {
            in: [WhatsAppSessionStatus.CONNECTED, WhatsAppSessionStatus.QR_CODE]
          }
        },
        data: {
          status: WhatsAppSessionStatus.DISCONNECTED,
          phone: null,
          qrCode: null,
          lastDisconnectedAt: new Date()
        }
      });

      this.logger.log(`${updateResult.count} sessões foram marcadas como desconectadas após reinício do servidor.`);
      
      // Limpar diretórios de autenticação órfãos (opcional)
      await this.cleanupOrphanedAuthDirectories();
      
    } catch (error) {
      this.logger.error('Erro ao verificar sessões inconsistentes:', error);
    }
  }

  /**
   * Remove diretórios de autenticação que não têm sessão correspondente no banco
   */
  private async cleanupOrphanedAuthDirectories(): Promise<void> {
    try {
      if (!fs.existsSync(this.authDir)) {
        return;
      }

      const authDirs = fs.readdirSync(this.authDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      if (authDirs.length === 0) {
        return;
      }

      // Buscar todas as sessões existentes no banco
      const existingSessions = await this.prisma.whatsAppSession.findMany({
        select: { sessionId: true }
      });

      const existingSessionIds = new Set(existingSessions.map(s => s.sessionId));

      // Remover diretórios órfãos
      let removedCount = 0;
      for (const dirName of authDirs) {
        if (!existingSessionIds.has(dirName)) {
          const dirPath = path.join(this.authDir, dirName);
          try {
            fs.rmSync(dirPath, { recursive: true, force: true });
            removedCount++;
            this.logger.debug(`Removido diretório de auth órfão: ${dirName}`);
          } catch (error) {
            this.logger.warn(`Erro ao remover diretório ${dirName}:`, error);
          }
        }
      }

      if (removedCount > 0) {
        this.logger.log(`${removedCount} diretórios de autenticação órfãos foram removidos.`);
      }

    } catch (error) {
      this.logger.error('Erro ao limpar diretórios de autenticação órfãos:', error);
    }
  }

  /**
   * Conecta automaticamente todas as sessões WhatsApp ativas no startup do servidor
   */
  private async autoConnectAllSessions(): Promise<void> {
    try {
      this.logger.log('Iniciando auto-conexão de todas as sessões WhatsApp...');
      
      // Buscar todas as sessões ativas no banco de dados
      const activeSessions = await this.prisma.whatsAppSession.findMany({
        where: {
          isActive: true,
          // Incluir apenas sessões que não estão em processo de conexão
          status: {
            not: WhatsAppSessionStatus.CONNECTING
          }
        }
      });

      if (activeSessions.length === 0) {
        this.logger.log('Nenhuma sessão ativa encontrada para conectar.');
        return;
      }

      this.logger.log(`Encontradas ${activeSessions.length} sessões ativas. Iniciando conexões...`);

      // Conectar todas as sessões em paralelo (com limite para evitar sobrecarga)
      const connectionPromises = activeSessions.map(session => 
        this.connectSessionWithRetry(session.sessionId)
      );

      // Aguardar todas as conexões completarem (ou falharem)
      const results = await Promise.allSettled(connectionPromises);
      
      // Contabilizar resultados
      let successCount = 0;
      let failureCount = 0;
      
      results.forEach((result, index) => {
        const sessionId = activeSessions[index].sessionId;
        if (result.status === 'fulfilled') {
          successCount++;
          this.logger.log(`✅ Sessão ${sessionId} conectada com sucesso na inicialização`);
        } else {
          failureCount++;
          this.logger.warn(`❌ Falha ao conectar sessão ${sessionId} na inicialização:`, result.reason);
        }
      });

      this.logger.log(`Auto-conexão finalizada: ${successCount} sucessos, ${failureCount} falhas`);
      
    } catch (error) {
      this.logger.error('Erro durante auto-conexão das sessões:', error);
    }
  }

  /**
   * Conecta uma sessão com retry em caso de falha
   */
  private async connectSessionWithRetry(sessionId: string, maxRetries: number = 2): Promise<void> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Tentativa ${attempt}/${maxRetries} de conectar sessão ${sessionId}`);
        
        await this.initializeWhatsAppConnection(sessionId);
        return; // Sucesso, sair da função
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`Tentativa ${attempt}/${maxRetries} falhou para sessão ${sessionId}:`, error.message);
        
        // Se não é a última tentativa, aguardar um pouco antes de tentar novamente
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Delay crescente
        }
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    throw new Error(`Falha ao conectar sessão ${sessionId} após ${maxRetries} tentativas: ${lastError?.message}`);
  }

  async onModuleDestroy() {
    // Desconectar todas as sessões ao destruir o módulo
    for (const [sessionId, socket] of this.sessions) {
      try {
        await socket.logout();
        socket.end(undefined);
      } catch (error) {
        this.logger.error(`Erro ao desconectar sessão ${sessionId}:`, error);
      }
    }
    this.sessions.clear();
  }

  async createSession(
    userId: string,
    organizationId: string,
    createSessionDto: CreateSessionDto
  ): Promise<SessionInfo> {
    const { name, type = WhatsAppSessionType.MAIN, webhookUrl } = createSessionDto;

    // Gerar ID único para a sessão
    const sessionId = `session_${organizationId}_${Date.now()}`;

    // Criar sessão no banco
    const session = await this.prisma.whatsAppSession.create({
      data: {
        name,
        sessionId,
        status: WhatsAppSessionStatus.CONNECTING,
        type,
        webhookUrl,
        organizationId,
        createdById: userId
      }
    });

    // Inicializar conexão WhatsApp
    await this.initializeWhatsAppConnection(session.sessionId);

    return this.formatSessionInfo(session);
  }

  async getSessionsByOrganization(organizationId: string): Promise<SessionInfo[]> {
    const sessions = await this.prisma.whatsAppSession.findMany({
      where: {
        organizationId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return sessions.map(this.formatSessionInfo);
  }

  async getSessionById(sessionId: string, organizationId: string): Promise<SessionInfo> {
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        sessionId,
        organizationId
      }
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    return this.formatSessionInfo(session);
  }

  async deleteSession(sessionId: string, organizationId: string): Promise<void> {
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        sessionId,
        organizationId
      }
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    // Desconectar sessão ativa se existir
    const activeSocket = this.sessions.get(sessionId);
    if (activeSocket) {
      try {
        await activeSocket.logout();
        activeSocket.end(undefined);
        this.sessions.delete(sessionId);
      } catch (error) {
        this.logger.error(`Erro ao desconectar sessão ${sessionId}:`, error);
      }
    }

    // Remover arquivos de autenticação
    const authPath = path.join(this.authDir, sessionId);
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }

    // Marcar como inativa no banco
    await this.prisma.whatsAppSession.update({
      where: { id: session.id },
      data: { isActive: false }
    });
  }

  async getQRCode(sessionId: string, organizationId: string): Promise<string | null> {
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        sessionId,
        organizationId
      }
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    return session.qrCode;
  }

  private async initializeWhatsAppConnection(sessionId: string): Promise<void> {
    try {
      const authPath = path.join(this.authDir, sessionId);
      
      // Garantir que o diretório existe
      if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(authPath);

      // Logger silencioso para o Baileys
      const logger = P({ level: 'silent' });

      const socket = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: false,
        logger,
        browser: ['Sistema Atendimento', 'Chrome', '1.0.0'],
        markOnlineOnConnect: true,
      });

      this.sessions.set(sessionId, socket);

      // Event listeners
      socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
        await this.handleConnectionUpdate(sessionId, update);
      });

      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('messages.upsert', async (m) => {
        await this.handleIncomingMessages(sessionId, m);
      });

    } catch (error) {
      this.logger.error(`Erro ao inicializar conexão WhatsApp para sessão ${sessionId}:`, error);
      await this.updateSessionStatus(sessionId, WhatsAppSessionStatus.FAILED);
    }
  }

  private async handleConnectionUpdate(
    sessionId: string, 
    update: Partial<ConnectionState>
  ): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Gerar QR Code
      const qrCodeData = await QRCode.toDataURL(qr);
      await this.updateSessionQRCode(sessionId, qrCodeData);
      await this.updateSessionStatus(sessionId, WhatsAppSessionStatus.QR_CODE);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      
      // Buscar dados da sessão para notificação
      const session = await this.prisma.whatsAppSession.findUnique({
        where: { sessionId },
        include: {
          warmupCampaignSessions: {
            include: {
              campaign: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (shouldReconnect) {
        this.logger.log(`Reconectando sessão ${sessionId}...`);
        await this.updateSessionStatus(sessionId, WhatsAppSessionStatus.CONNECTING);
        setTimeout(() => this.initializeWhatsAppConnection(sessionId), 3000);
      } else {
        this.logger.log(`Sessão ${sessionId} foi desconectada permanentemente`);
        await this.updateSessionStatus(sessionId, WhatsAppSessionStatus.DISCONNECTED);
        this.sessions.delete(sessionId);

        // Notificar desconexão
        if (session) {
          const disconnectionReason = this.getDisconnectionReason(lastDisconnect);
          const campaignIds = session.warmupCampaignSessions.map(cs => cs.campaign.id);

          this.notificationsService.notifySessionDisconnected(
            session.organizationId,
            {
              sessionId: session.id,
              sessionName: session.name,
              phone: session.phone || undefined,
              campaignIds,
              disconnectedAt: new Date(),
              reason: disconnectionReason,
            },
          );
        }
      }
    } else if (connection === 'open') {
      this.logger.log(`Sessão ${sessionId} conectada com sucesso`);
      await this.updateSessionStatus(sessionId, WhatsAppSessionStatus.CONNECTED);
      
      // Obter informações do número
      const socket = this.sessions.get(sessionId);
      if (socket?.user?.id) {
        const phone = socket.user.id.split('@')[0];
        await this.updateSessionPhone(sessionId, phone);
      }
    }
  }

  private getDisconnectionReason(lastDisconnect: any): string {
    if (!lastDisconnect?.error) return 'Desconexão desconhecida';

    const boom = lastDisconnect.error as Boom;
    const statusCode = boom.output?.statusCode;

    switch (statusCode) {
      case DisconnectReason.badSession:
        return 'Sessão inválida';
      case DisconnectReason.connectionClosed:
        return 'Conexão fechada';
      case DisconnectReason.connectionLost:
        return 'Conexão perdida';
      case DisconnectReason.connectionReplaced:
        return 'Conexão substituída';
      case DisconnectReason.loggedOut:
        return 'Deslogado do WhatsApp';
      case DisconnectReason.restartRequired:
        return 'Reinicialização necessária';
      case DisconnectReason.timedOut:
        return 'Tempo limite excedido';
      default:
        return `Erro desconhecido (${statusCode})`;
    }
  }

  private async handleIncomingMessages(
    sessionId: string,
    messageUpsert: { messages: proto.IWebMessageInfo[]; type: any }
  ): Promise<void> {
    const { messages } = messageUpsert;

    for (const message of messages) {
      if (message.key && message.message) {
        await this.saveMessage(sessionId, message);
      }
    }
  }

  private async saveMessage(sessionId: string, message: proto.IWebMessageInfo): Promise<void> {
    try {
      const session = await this.prisma.whatsAppSession.findUnique({
        where: { sessionId }
      });

      if (!session) return;

      const messageId = message.key.id!;
      const rawChatId = message.key.remoteJid!;
      const chatId = this.cleanChatId(rawChatId); // Limpar o chatId removendo :XX
      const fromMe = message.key.fromMe || false;
      const timestamp = new Date((message.messageTimestamp as number) * 1000);

      let content = '';
      let messageType = 'unknown';

      if (message.message?.conversation) {
        content = message.message.conversation;
        messageType = 'text';
      } else if (message.message?.extendedTextMessage?.text) {
        content = message.message.extendedTextMessage.text;
        messageType = 'text';
      } else if (message.message?.imageMessage) {
        messageType = 'image';
        content = message.message.imageMessage.caption || '';
      } else if (message.message?.videoMessage) {
        messageType = 'video';
        content = message.message.videoMessage.caption || '';
      } else if (message.message?.audioMessage) {
        messageType = 'audio';
      } else if (message.message?.documentMessage) {
        messageType = 'document';
        content = message.message.documentMessage.fileName || '';
      }

      // Verificar se a mensagem já existe antes de criar
      const existingMessage = await this.prisma.whatsAppMessage.findUnique({
        where: { messageId }
      });

      if (!existingMessage) {
        await this.prisma.whatsAppMessage.create({
          data: {
            messageId,
            chatId,
            fromMe,
            messageType,
            content,
            timestamp,
            sessionId: session.id,
            status: 'received'
          }
        });
      }

    } catch (error) {
      this.logger.error(`Erro ao salvar mensagem da sessão ${sessionId}:`, error);
    }
  }

  private async updateSessionStatus(sessionId: string, status: WhatsAppSessionStatus): Promise<void> {
    const updateData: any = { status };

    if (status === WhatsAppSessionStatus.CONNECTED) {
      updateData.lastConnectedAt = new Date();
      updateData.qrCode = null; // Limpar QR Code quando conectado
    } else if (status === WhatsAppSessionStatus.DISCONNECTED) {
      updateData.lastDisconnectedAt = new Date();
    }

    await this.prisma.whatsAppSession.updateMany({
      where: { sessionId },
      data: updateData
    });
  }

  private async updateSessionQRCode(sessionId: string, qrCode: string): Promise<void> {
    await this.prisma.whatsAppSession.updateMany({
      where: { sessionId },
      data: { qrCode }
    });
  }

  private async updateSessionPhone(sessionId: string, phone: string): Promise<void> {
    await this.prisma.whatsAppSession.updateMany({
      where: { sessionId },
      data: { phone }
    });
  }

  private formatSessionInfo(session: any): SessionInfo {
    return {
      id: session.id,
      name: session.name,
      sessionId: session.sessionId,
      phone: session.phone,
      qrCode: session.qrCode,
      status: session.status,
      type: session.type,
      isActive: session.isActive,
      lastConnectedAt: session.lastConnectedAt,
      lastDisconnectedAt: session.lastDisconnectedAt,
      createdAt: session.createdAt
    };
  }

  // Método para enviar mensagem
  async sendMessage(
    sessionId: string,
    organizationId: string,
    to: string,
    message: string,
    messageType: string = 'text',
    mediaPath?: string
  ): Promise<any> {
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        sessionId,
        organizationId,
        status: WhatsAppSessionStatus.CONNECTED
      }
    });

    if (!session) {
      throw new BadRequestException('Sessão não encontrada ou não conectada');
    }

    const socket = this.sessions.get(sessionId);
    if (!socket) {
      throw new BadRequestException('Conexão da sessão não está ativa');
    }

    try {
      const chatId = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      let result;

      if (messageType === 'text') {
        result = await socket.sendMessage(chatId, { text: message });
      } else if (messageType === 'image' && mediaPath) {
        result = await socket.sendMessage(chatId, {
          image: { url: mediaPath },
          caption: message
        });
      } else if (messageType === 'audio' && mediaPath) {
        result = await socket.sendMessage(chatId, {
          audio: { url: mediaPath },
          mimetype: 'audio/mpeg'
        });
      } else if (messageType === 'video' && mediaPath) {
        result = await socket.sendMessage(chatId, {
          video: { url: mediaPath },
          caption: message
        });
      } else if (messageType === 'document' && mediaPath) {
        const fileName = require('path').basename(mediaPath);
        result = await socket.sendMessage(chatId, {
          document: { url: mediaPath },
          fileName: fileName,
          mimetype: 'application/octet-stream',
          caption: message
        });
      } else {
        // Fallback para texto se tipo não suportado
        result = await socket.sendMessage(chatId, { text: message });
      }

      if (result && result.key && result.key.id) {
        // Salvar mensagem enviada
        await this.prisma.whatsAppMessage.create({
          data: {
            messageId: result.key.id,
            chatId,
            fromMe: true,
            messageType,
            content: message,
            timestamp: new Date(),
            sessionId: session.id,
            status: 'sent'
          }
        });
      }

      return result;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem na sessão ${sessionId}:`, error);
      throw new BadRequestException('Falha ao enviar mensagem');
    }
  }

  // Método para marcar mensagens como lidas
  async markMessagesAsRead(
    sessionId: string, 
    organizationId: string, 
    chatId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const session = await this.prisma.whatsAppSession.findFirst({
        where: {
          sessionId,
          organizationId,
          status: WhatsAppSessionStatus.CONNECTED
        }
      });

      if (!session) {
        throw new BadRequestException('Sessão não encontrada ou não conectada');
      }

      const socket = this.sessions.get(sessionId);
      if (!socket) {
        throw new BadRequestException('Conexão da sessão não está ativa');
      }

      // Formatar e limpar chatId se necessário
      const cleanedChatId = this.cleanChatId(chatId);
      const formattedChatId = cleanedChatId.includes('@') ? cleanedChatId : `${cleanedChatId}@s.whatsapp.net`;

      this.logger.debug(`🚀 Iniciando marcação como lido para chat ${formattedChatId}`);

      // Método principal: chatModify com lastMessages sintéticas (método que funcionou no teste)
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        
        await socket.chatModify({
          markRead: true,
          lastMessages: [{
            key: {
              remoteJid: formattedChatId,
              id: `read_${timestamp}`,
              fromMe: false
            },
            messageTimestamp: timestamp
          }]
        }, formattedChatId);
        
        this.logger.debug(`✅ Sucesso com chatModify principal para ${formattedChatId}`);
        return {
          success: true,
          message: `Chat marcado como lido com chatModify: ${formattedChatId}`
        };
      } catch (chatModifyError) {
        this.logger.warn(`chatModify principal falhou: ${chatModifyError.message}`);
      }

      // Fallback 1: sendReceipt direto  
      try {
        await socket.sendReceipt(formattedChatId, undefined, ['read'], undefined);
        this.logger.debug(`✅ Sucesso com sendReceipt para ${formattedChatId}`);
        
        return {
          success: true,
          message: `Receipt de leitura enviado: ${formattedChatId}`
        };
      } catch (receiptError) {
        this.logger.warn(`sendReceipt falhou: ${receiptError.message}`);
      }

      // Fallback 2: Método híbrido (presença + receipt + chatModify)
      try {
        // Simular presença ativa
        await socket.sendPresenceUpdate('available');
        await socket.sendPresenceUpdate('available', formattedChatId);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Enviar receipt de leitura
        await socket.sendReceipt(formattedChatId, undefined, ['read'], undefined);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Finalizar com chatModify usando lastMessages
        const timestamp = Math.floor(Date.now() / 1000);
        await socket.chatModify({
          markRead: true,
          lastMessages: [{
            key: {
              remoteJid: formattedChatId,
              id: `read_${timestamp}`,
              fromMe: false
            },
            messageTimestamp: timestamp
          }]
        }, formattedChatId);
        
        this.logger.debug(`✅ Sucesso com método híbrido para ${formattedChatId}`);
        
        return {
          success: true,
          message: `Chat marcado como lido (método híbrido): ${formattedChatId}`
        };
      } catch (hybridError) {
        this.logger.warn(`Método híbrido falhou: ${hybridError.message}`);
      }

      // Fallback final: readMessages
      try {
        const messageKey = {
          remoteJid: formattedChatId,
          id: `fallback_read_${Date.now()}`,
          fromMe: false
        };
        
        await socket.readMessages([messageKey]);
        
        this.logger.debug(`✅ Sucesso com readMessages fallback para ${formattedChatId}`);
        
        return {
          success: true,
          message: `ReadMessages executado: ${formattedChatId}`
        };
      } catch (readError) {
        throw new Error(`Todos os métodos falharam - chatModify: ${readError.message}`);
      }

    } catch (error) {
      this.logger.error(`Erro ao marcar mensagens como lidas: ${error.message}`);
      return {
        success: false,
        message: `Erro ao marcar mensagens como lidas: ${error.message}`
      };
    }
  }

  // Método específico para teste do chat problemático
  private async markSpecificChatAsRead(
    socket: any, 
    chatId: string, 
    sessionId: string
  ): Promise<{ success: boolean; message: string }> {
    console.log(`🧪🧪🧪 TESTE ESPECÍFICO INICIADO: Tentando marcar chat ${chatId} como lido na sessão ${sessionId}`);
    this.logger.log(`🧪 TESTE ESPECÍFICO: Tentando marcar chat ${chatId} como lido na sessão ${sessionId}`);
    
    // Primeiro, vamos buscar as mensagens mais recentes do chat
    let lastMessages = [];
    try {
      console.log(`📱 Buscando mensagens do chat ${chatId}...`);
      const messages = await socket.fetchMessagesFromWA(chatId, 50);
      
      if (messages && messages.length > 0) {
        // Filtrar mensagens não lidas (que não são nossas)
        const unreadMessages = messages.filter((msg: any) => 
          !msg.key.fromMe && 
          msg.messageTimestamp &&
          !msg.status?.includes('read')
        );
        
        console.log(`� Encontradas ${messages.length} mensagens totais, ${unreadMessages.length} não lidas`);
        
        // Pegar as últimas mensagens para marcar como lidas
        lastMessages = messages.slice(0, 10).map((msg: any) => ({
          key: msg.key,
          messageTimestamp: msg.messageTimestamp,
          status: msg.status
        }));
        
        console.log(`📋 Preparadas ${lastMessages.length} mensagens para marcar como lidas`);
      } else {
        console.log(`📭 Nenhuma mensagem encontrada no chat ${chatId}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao buscar mensagens: ${error.message}`);
      this.logger.warn(`❌ Erro ao buscar mensagens: ${error.message}`);
    }
    
    const methods = [
      {
        name: 'Buscar mensagens reais e usar chatModify',
        action: async () => {
          console.log(`🔄 Buscando mensagens reais do chat ${chatId}`);
          
          try {
            // Tentar buscar mensagens usando loadMessages
            const messages = await socket.loadMessages(chatId, 20);
            console.log(`📱 Encontradas ${messages?.length || 0} mensagens`);
            
            if (messages && messages.length > 0) {
              // Filtrar apenas mensagens que não são nossas e preparar para marcar como lidas
              const unreadMessages = messages
                .filter(msg => !msg.key.fromMe)
                .slice(0, 5)
                .map(msg => ({
                  key: msg.key,
                  messageTimestamp: msg.messageTimestamp
                }));
              
              if (unreadMessages.length > 0) {
                console.log(`📋 Preparando ${unreadMessages.length} mensagens para marcar como lidas`);
                await socket.chatModify({
                  markRead: true,
                  lastMessages: unreadMessages
                }, chatId);
                console.log(`✅ chatModify executado com ${unreadMessages.length} mensagens reais`);
              } else {
                await socket.chatModify({ markRead: true }, chatId);
                console.log(`✅ chatModify básico (sem mensagens de outros)`);
              }
            } else {
              await socket.chatModify({ markRead: true }, chatId);
              console.log(`✅ chatModify básico (nenhuma mensagem encontrada)`);
            }
          } catch (loadError) {
            console.log(`⚠️ Erro ao buscar mensagens: ${loadError.message}, tentando chatModify básico`);
            await socket.chatModify({ markRead: true }, chatId);
            console.log(`✅ chatModify básico executado após erro`);
          }
        }
      },
      {
        name: 'sendReadReceipt com key atual',
        action: async () => {
          console.log(`🔄 Executando sendReadReceipt avançado para ${chatId}`);
          
          // Gerar uma key realística baseada no timestamp atual
          const now = Date.now();
          const messageId = `3EB0${now.toString(16).toUpperCase()}`;
          
          await socket.sendReadReceipt(chatId, undefined, [messageId]);
          console.log(`✅ sendReadReceipt executado com messageId: ${messageId}`);
        }
      },
      {
        name: 'readMessages com mensagens reais',
        action: async () => {
          console.log(`🔄 Executando readMessages com mensagens reais para ${chatId}`);
          if (lastMessages.length > 0) {
            const messageIds = lastMessages.slice(0, 10).map((msg: any) => ({
              remoteJid: chatId,
              id: msg.key.id,
              participant: msg.key.participant
            }));
            
            await socket.readMessages(messageIds);
            console.log(`✅ ${messageIds.length} mensagens marcadas como lidas via readMessages`);
          } else {
            // Tentar com timestamp atual se não há mensagens
            const now = Date.now();
            await socket.readMessages([{
              remoteJid: chatId,
              id: `test_${now}`,
              participant: undefined
            }]);
            console.log(`✅ readMessages executado com timestamp ${now}`);
          }
        }
      },
      {
        name: 'chatModify com markRead false depois true',
        action: async () => {
          console.log(`🔄 Executando sequência markRead false->true para ${chatId}`);
          
          // Primeiro marcar como não lida
          if (lastMessages.length > 0) {
            await socket.chatModify({ 
              markRead: false, 
              lastMessages: lastMessages 
            }, chatId);
            console.log(`🔄 Chat marcado como não lido`);
          }
          
          // Aguardar um pouco
          await new Promise(r => setTimeout(r, 1000));
          
          // Depois marcar como lida
          if (lastMessages.length > 0) {
            await socket.chatModify({ 
              markRead: true, 
              lastMessages: lastMessages 
            }, chatId);
            console.log(`✅ Chat marcado como lido após sequência`);
          } else {
            await socket.chatModify({ markRead: true }, chatId);
            console.log(`✅ Chat marcado como lido (básico) após sequência`);
          }
        }
      },
      {
        name: 'sendPresenceUpdate com reading',
        action: async () => {
          console.log(`🔄 Executando presença de leitura para ${chatId}`);
          await socket.sendPresenceUpdate('available');
          await new Promise(r => setTimeout(r, 500));
          await socket.sendPresenceUpdate('composing', chatId);
          await new Promise(r => setTimeout(r, 1000));
          await socket.sendPresenceUpdate('paused', chatId);
          await new Promise(r => setTimeout(r, 500));
          
          // Simular leitura
          if (lastMessages.length > 0) {
            await socket.chatModify({ 
              markRead: true, 
              lastMessages: lastMessages 
            }, chatId);
          }
          
          await socket.sendPresenceUpdate('available');
          console.log(`✅ Sequência de presença + leitura executada para ${chatId}`);
        }
      },
      {
        name: 'Método forçado - múltiplas tentativas',
        action: async () => {
          console.log(`🔄 Executando método forçado com múltiplas tentativas para ${chatId}`);
          
          // Tentativa 1: chatModify básico
          try {
            await socket.chatModify({ markRead: true }, chatId);
            console.log(`✅ Primeira tentativa chatModify`);
          } catch (e) {
            console.log(`⚠️ Primeira tentativa falhou: ${e.message}`);
          }
          
          await new Promise(r => setTimeout(r, 1000));
          
          // Tentativa 2: Simular presença ativa + chatModify
          try {
            await socket.sendPresenceUpdate('available');
            await socket.sendPresenceUpdate('available', chatId);
            await new Promise(r => setTimeout(r, 500));
            
            await socket.chatModify({ markRead: true }, chatId);
            console.log(`✅ Segunda tentativa com presença`);
          } catch (e) {
            console.log(`⚠️ Segunda tentativa falhou: ${e.message}`);
          }
          
          await new Promise(r => setTimeout(r, 1000));
          
          // Tentativa 3: sendReceipt + chatModify
          try {
            const messageId = `3EB0${Date.now().toString(16).toUpperCase()}`;
            await socket.sendReceipt(chatId, undefined, ['read'], messageId);
            await new Promise(r => setTimeout(r, 300));
            await socket.chatModify({ markRead: true }, chatId);
            console.log(`✅ Terceira tentativa com sendReceipt`);
          } catch (e) {
            console.log(`⚠️ Terceira tentativa falhou: ${e.message}`);
          }
          
          console.log(`✅ Método forçado concluído para ${chatId}`);
        }
      }
    ];

    for (const method of methods) {
      try {
        console.log(`🧪🧪 TESTANDO MÉTODO: ${method.name}`);
        this.logger.log(`🧪 Testando método: ${method.name}`);
        
        await method.action();
        
        console.log(`✅✅ SUCESSO com método: ${method.name} para chat ${chatId}`);
        this.logger.log(`✅ SUCESSO com método: ${method.name} para chat ${chatId}`);
        
        return {
          success: true,
          message: `✅ Chat ${chatId} marcado como lido usando: ${method.name}`
        };
        
      } catch (error) {
        console.log(`❌❌ Método ${method.name} falhou: ${error.message}`);
        this.logger.warn(`❌ Método ${method.name} falhou: ${error.message}`);
        continue;
      }
    }

    console.log(`🚫🚫🚫 TODOS os métodos de teste falharam para o chat ${chatId}`);
    this.logger.error(`🚫 TODOS os métodos de teste falharam para o chat ${chatId}`);
    return {
      success: false,
      message: `Nenhum método funcionou para marcar o chat ${chatId} como lido`
    };
  }

  // Método para obter TODOS os chats ativos (não apenas não lidos)
  async getAllActiveChats(
    sessionId: string,
    organizationId: string
  ): Promise<Array<{ chatId: string; unreadCount: number }>> {
    try {
      const session = await this.prisma.whatsAppSession.findFirst({
        where: {
          sessionId,
          organizationId,
          status: WhatsAppSessionStatus.CONNECTED
        }
      });

      if (!session) {
        return [];
      }

      const socket = this.sessions.get(sessionId);
      if (!socket) {
        return [];
      }

      this.logger.debug(`🔍 Buscando todos os chats ativos para sessão ${sessionId}`);

      // Estratégia 1: Buscar chats recentes no banco de dados primeiro
      try {
        const recentMessages = await this.prisma.whatsAppMessage.groupBy({
          by: ['chatId'],
          where: {
            sessionId: session.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
            }
          },
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          },
          take: 50 // Pegar os 50 chats mais ativos
        });

        const activeChats = recentMessages.map(item => ({
          chatId: item.chatId,
          unreadCount: item._count.id
        }));

        console.log(`� Encontrados ${activeChats.length} chats ativos nas últimas 24h`);
        this.logger.debug(`Encontrados ${activeChats.length} chats ativos nas últimas 24h`);
        
        if (activeChats.length > 0) {
          return activeChats;
        }
      } catch (dbError) {
        this.logger.warn(`Falha ao buscar chats recentes no banco: ${dbError.message}`);
      }

      // Estratégia 2: Buscar no banco de dados como fallback
      const dbMessages = await this.prisma.whatsAppMessage.groupBy({
        by: ['chatId'],
        where: {
          sessionId: session.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 30 // Limitar a 30 chats mais ativos
      });

      const dbChats = dbMessages.map(item => ({
        chatId: item.chatId,
        unreadCount: 0 // Vamos tentar marcar todos como lidos
      }));

      console.log(`💾 Encontrados ${dbChats.length} chats no banco de dados`);
      this.logger.debug(`Encontrados ${dbChats.length} chats no banco de dados`);

      return dbChats;

    } catch (error) {
      this.logger.error(`Erro ao obter chats ativos: ${error.message}`);
      console.log(`❌ Erro ao obter chats ativos: ${error.message}`);
      return [];
    }
  }

  // Método para obter conversas com mensagens não lidas (mantido para compatibilidade)
  async getUnreadConversations(
    sessionId: string,
    organizationId: string
  ): Promise<Array<{ chatId: string; unreadCount: number }>> {
    return this.getAllActiveChats(sessionId, organizationId);
  }

  // Método para desconectar sessão
  async disconnectSession(sessionId: string, organizationId: string): Promise<{ message: string; status: string }> {
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        sessionId,
        organizationId
      }
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    try {
      const socket = this.sessions.get(sessionId);
      if (socket) {
        await socket.logout();
        this.sessions.delete(sessionId);
      }

      await this.updateSessionStatus(sessionId, WhatsAppSessionStatus.DISCONNECTED);
      await this.prisma.whatsAppSession.updateMany({
        where: { sessionId },
        data: { 
          lastDisconnectedAt: new Date(),
          qrCode: null,
          phone: null
        }
      });

      this.logger.log(`Sessão ${sessionId} desconectada com sucesso`);
      
      return {
        message: 'Sessão desconectada com sucesso',
        status: 'DISCONNECTED'
      };
    } catch (error) {
      this.logger.error(`Erro ao desconectar sessão ${sessionId}:`, error);
      throw new BadRequestException('Falha ao desconectar sessão');
    }
  }

  // Método para reconectar sessão
  async reconnectSession(sessionId: string, organizationId: string): Promise<{ message: string; status: string }> {
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        sessionId,
        organizationId
      }
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    try {
      // Desconectar sessão atual se estiver ativa
      const currentSocket = this.sessions.get(sessionId);
      if (currentSocket) {
        try {
          await currentSocket.logout();
        } catch (error) {
          this.logger.warn(`Erro ao desconectar sessão anterior ${sessionId}:`, error);
        }
        this.sessions.delete(sessionId);
      }

      // Limpar dados da sessão
      await this.prisma.whatsAppSession.updateMany({
        where: { sessionId },
        data: { 
          qrCode: null,
          phone: null,
          lastDisconnectedAt: new Date()
        }
      });

      // Inicializar nova conexão
      await this.updateSessionStatus(sessionId, WhatsAppSessionStatus.CONNECTING);
      await this.initializeWhatsAppConnection(sessionId);

      this.logger.log(`Sessão ${sessionId} iniciando reconexão`);
      
      return {
        message: 'Reconexão iniciada com sucesso',
        status: 'CONNECTING'
      };
    } catch (error) {
      this.logger.error(`Erro ao reconectar sessão ${sessionId}:`, error);
      await this.updateSessionStatus(sessionId, WhatsAppSessionStatus.FAILED);
      throw new BadRequestException('Falha ao reconectar sessão');
    }
  }

  // Método para atualizar/regenerar QR code
  async refreshQRCode(sessionId: string, organizationId: string): Promise<{ message: string; status: string }> {
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        sessionId,
        organizationId
      }
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (session.status === WhatsAppSessionStatus.CONNECTED) {
      return {
        message: 'Sessão já está conectada, não é necessário atualizar QR code',
        status: 'CONNECTED'
      };
    }

    try {
      // Se a sessão está em estado de falha ou outro, reconectar
      if (session.status === WhatsAppSessionStatus.FAILED || 
          session.status === WhatsAppSessionStatus.DISCONNECTED) {
        return await this.reconnectSession(sessionId, organizationId);
      }

      // Se está conectando mas sem QR code, forçar nova inicialização
      const currentSocket = this.sessions.get(sessionId);
      if (currentSocket) {
        try {
          await currentSocket.logout();
        } catch (error) {
          this.logger.warn(`Erro ao desconectar para atualizar QR code ${sessionId}:`, error);
        }
        this.sessions.delete(sessionId);
      }

      // Limpar QR code atual
      await this.prisma.whatsAppSession.updateMany({
        where: { sessionId },
        data: { qrCode: null }
      });

      // Reinicializar conexão para gerar novo QR code
      await this.updateSessionStatus(sessionId, WhatsAppSessionStatus.CONNECTING);
      await this.initializeWhatsAppConnection(sessionId);

      this.logger.log(`QR code atualizado para sessão ${sessionId}`);
      
      return {
        message: 'QR code atualizado com sucesso',
        status: 'CONNECTING'
      };
    } catch (error) {
      this.logger.error(`Erro ao atualizar QR code da sessão ${sessionId}:`, error);
      await this.updateSessionStatus(sessionId, WhatsAppSessionStatus.FAILED);
      throw new BadRequestException('Falha ao atualizar QR code');
    }
  }

  async getSessionStatus(sessionId: string, organizationId: string): Promise<{
    status: string;
    qrCodeReady: boolean;
    connected: boolean;
    phone?: string;
    lastUpdate: Date;
    timestamp: number;
  }> {
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        sessionId,
        organizationId
      }
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    // Verificar consistência entre banco e memória
    const socketExists = this.sessions.has(sessionId);
    const dbStatus = session.status;
    
    // Se o banco diz que está conectado mas não há socket na memória, corrigir
    if ((dbStatus === WhatsAppSessionStatus.CONNECTED || dbStatus === WhatsAppSessionStatus.QR_CODE) && !socketExists) {
      this.logger.warn(`Inconsistência detectada na sessão ${sessionId}: status ${dbStatus} no banco mas sem socket na memória`);
      
      // Atualizar para DISCONNECTED
      await this.prisma.whatsAppSession.update({
        where: { id: session.id },
        data: {
          status: WhatsAppSessionStatus.DISCONNECTED,
          phone: null,
          qrCode: null,
          lastDisconnectedAt: new Date()
        }
      });

      // Retornar status corrigido
      const now = new Date();
      return {
        status: WhatsAppSessionStatus.DISCONNECTED,
        qrCodeReady: false,
        connected: false,
        phone: undefined,
        lastUpdate: now,
        timestamp: now.getTime()
      };
    }

    const now = new Date();
    const qrCodeReady = session.status === WhatsAppSessionStatus.QR_CODE && session.qrCode !== null;
    const connected = session.status === WhatsAppSessionStatus.CONNECTED && socketExists;

    return {
      status: session.status,
      qrCodeReady,
      connected,
      phone: session.phone || undefined,
      lastUpdate: session.updatedAt || session.createdAt,
      timestamp: now.getTime()
    };
  }

  /**
   * Valida se um número WhatsApp é válido e existe
   */
  async validateWhatsAppNumber(phone: string, organizationId: string): Promise<{
    isValid: boolean;
    exists?: boolean;
    formattedNumber?: string;
    error?: string;
    testedNumbers?: string[];
    correctFormat?: string;
  }> {
    try {
      // 1. Validar formato básico do número brasileiro
      const validation = this.validateBrazilianPhoneFormat(phone);
      if (!validation.isValid) {
        return {
          isValid: false,
          error: validation.error
        };
      }

      // 2. Buscar uma sessão ativa da organização para verificar no WhatsApp
      const activeSession = await this.prisma.whatsAppSession.findFirst({
        where: {
          organizationId,
          status: WhatsAppSessionStatus.CONNECTED,
          isActive: true,
        },
      });

      if (!activeSession) {
        return {
          isValid: false,
          error: 'Nenhuma sessão WhatsApp ativa encontrada para validação'
        };
      }

      const socket = this.sessions.get(activeSession.sessionId);
      if (!socket) {
        return {
          isValid: false,
          error: 'Sessão WhatsApp não está conectada'
        };
      }

      // 3. Gerar variações possíveis do número (8 e 9 dígitos)
      const possibleNumbers = this.generatePhoneVariations(phone);
      const testedNumbers: string[] = [];
      
      this.logger.log(`🔍 Testando variações do número ${phone}: ${possibleNumbers.join(', ')}`);

      // 4. Testar cada variação no WhatsApp
      for (const numberToTest of possibleNumbers) {
        try {
          testedNumbers.push(numberToTest);
          const jid = `${numberToTest}@s.whatsapp.net`;
          const results = await socket.onWhatsApp(jid);
          
          if (results && results.length > 0 && results[0].exists) {
            this.logger.log(`✅ Número válido encontrado no WhatsApp: ${numberToTest}`);
            return {
              isValid: true,
              exists: true,
              formattedNumber: numberToTest,
              testedNumbers,
              correctFormat: numberToTest
            };
          } else {
            this.logger.debug(`❌ Número não encontrado: ${numberToTest}`);
          }
        } catch (whatsappError) {
          this.logger.warn(`Erro ao testar número ${numberToTest}: ${whatsappError.message}`);
        }
      }

      // 5. Se nenhuma variação foi encontrada
      this.logger.warn(`❌ Nenhuma variação válida encontrada para ${phone}`);
      return {
        isValid: false,
        error: `Número não encontrado no WhatsApp. Testamos: ${testedNumbers.join(', ')}`,
        testedNumbers
      };

    } catch (error) {
      this.logger.error(`Erro na validação do número: ${error.message}`);
      return {
        isValid: false,
        error: 'Erro interno na validação do número'
      };
    }
  }

  /**
   * Gera variações possíveis de um número brasileiro (8 e 9 dígitos)
   */
  private generatePhoneVariations(phone: string): string[] {
    // Limpar o número
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Se não começar com 55, adicionar
    let baseNumber = cleanPhone;
    if (!baseNumber.startsWith('55')) {
      baseNumber = '55' + baseNumber;
    }

    // Extrair partes: 55 + DDD + número
    if (baseNumber.length < 12) {
      return []; // Número muito curto
    }

    const countryCode = baseNumber.substring(0, 2); // 55
    const ddd = baseNumber.substring(2, 4); // DDD
    const numberPart = baseNumber.substring(4); // restante do número

    const variations: string[] = [];

    // Validar DDD
    const dddNumber = parseInt(ddd);
    if (dddNumber < 11 || dddNumber > 99) {
      return []; // DDD inválido
    }

    if (numberPart.length === 8) {
      // Se tem 8 dígitos, gerar versões com 8 e 9 dígitos
      const eightDigitNumber = `${countryCode}${ddd}${numberPart}`;
      const nineDigitNumber = `${countryCode}${ddd}9${numberPart}`;
      
      variations.push(eightDigitNumber);
      variations.push(nineDigitNumber);
      
    } else if (numberPart.length === 9) {
      // Se tem 9 dígitos, gerar versões com 9 e 8 dígitos (removendo o primeiro 9)
      const nineDigitNumber = `${countryCode}${ddd}${numberPart}`;
      
      // Se começar com 9, criar versão sem o 9
      if (numberPart.startsWith('9')) {
        const eightDigitNumber = `${countryCode}${ddd}${numberPart.substring(1)}`;
        variations.push(eightDigitNumber);
      }
      
      variations.push(nineDigitNumber);
      
    } else {
      // Número com tamanho inválido, retornar como está
      variations.push(baseNumber);
    }

    // Remover duplicados e retornar
    return [...new Set(variations)];
  }

  /**
   * Valida formato de número brasileiro (versão mais flexível)
   */
  private validateBrazilianPhoneFormat(phone: string): {
    isValid: boolean;
    formattedNumber?: string;
    error?: string;
  } {
    if (!phone) {
      return {
        isValid: false,
        error: 'Número de telefone é obrigatório'
      };
    }

    // Remover caracteres especiais e espaços
    const cleanPhone = phone.replace(/\D/g, '');

    // Verificar tamanho mínimo
    if (cleanPhone.length < 10) {
      return {
        isValid: false,
        error: 'Número muito curto. Deve ter pelo menos 10 dígitos'
      };
    }

    // Se não começar com 55, tentar adicionar
    let workingNumber = cleanPhone;
    if (!cleanPhone.startsWith('55')) {
      workingNumber = '55' + cleanPhone;
    }

    // Verificar se ainda é válido após adicionar código do país
    if (workingNumber.length < 12 || workingNumber.length > 13) {
      return {
        isValid: false,
        error: 'Número deve ter entre 12 e 13 dígitos incluindo código do país (55)'
      };
    }

    // Extrair DDD
    const ddd = workingNumber.substring(2, 4);
    const dddNumber = parseInt(ddd);
    
    if (dddNumber < 11 || dddNumber > 99) {
      return {
        isValid: false,
        error: 'DDD inválido. Deve estar entre 11 e 99'
      };
    }

    // Extrair parte do número
    const numberPart = workingNumber.substring(4);
    
    // Verificar se não são todos os dígitos iguais
    if (new Set(numberPart).size === 1) {
      return {
        isValid: false,
        error: 'Número inválido: todos os dígitos são iguais'
      };
    }

    return {
      isValid: true,
      formattedNumber: workingNumber
    };
  }
}

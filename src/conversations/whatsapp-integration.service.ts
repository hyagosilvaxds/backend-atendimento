import { Injectable } from '@nestjs/common';
import { MessagesService } from '../conversations/messages.service';
import { ConversationEventsService } from '../conversations/conversation-events.service';

@Injectable()
export class WhatsAppIntegrationService {
  constructor(
    private messagesService: MessagesService,
    private conversationEvents: ConversationEventsService,
  ) {}

  /**
   * Processar mensagem recebida do WhatsApp
   * Este método deve ser chamado quando uma mensagem é recebida via webhook
   */
  async handleIncomingMessage(sessionId: string, whatsappMessage: any) {
    try {
      // Processar mensagem através do MessagesService
      const message = await this.messagesService.processIncomingMessage(
        sessionId,
        whatsappMessage
      );

      // Notificar via WebSocket sobre nova mensagem
      await this.conversationEvents.notifyNewMessage(
        message.conversationId,
        message
      );

      return message;
    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error);
      throw error;
    }
  }

  /**
   * Atualizar status de mensagem (entregue, lida, etc.)
   */
  async handleMessageStatusUpdate(messageId: string, status: string, timestamp?: Date) {
    try {
      // Atualizar no banco de dados
      const updatedMessage = await this.messagesService.update(
        messageId,
        {
          status: status as any,
          ...(status === 'DELIVERED' && { deliveredAt: timestamp?.toISOString() }),
          ...(status === 'READ' && { readAt: timestamp?.toISOString() }),
        },
        '', // organizationId será inferido pelo service
      );

      // Notificar via WebSocket sobre atualização
      await this.conversationEvents.notifyMessageUpdate(
        updatedMessage.conversationId || '',
        updatedMessage
      );

      return updatedMessage;
    } catch (error) {
      console.error('Erro ao atualizar status da mensagem:', error);
      throw error;
    }
  }

  /**
   * Exemplo de estrutura de mensagem recebida do WhatsApp
   */
  getExampleIncomingMessage() {
    return {
      id: 'whatsapp_message_id',
      chatId: '5511999999999@c.us',
      type: 'text',
      content: 'Olá! Como posso ajudar?',
      fromMe: false,
      fromParticipant: '5511888888888@c.us',
      fromName: 'João Silva',
      timestamp: Date.now(),
      isGroup: false,
      contactName: 'João Silva',
      // Para mídias
      mediaUrl: null,
      caption: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
    };
  }
}

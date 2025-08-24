import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/message.dto';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/conversations',
})
export class ConversationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, AuthenticatedSocket[]>();

  constructor(
    private conversationsService: ConversationsService,
    private messagesService: MessagesService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Autenticar o usuário via token
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token);
      client.userId = decoded.sub;
      client.organizationId = decoded.organizationId;

      // Verificar se o userId foi definido
      if (!client.userId) {
        client.disconnect();
        return;
      }

      // Adicionar à lista de usuários conectados
      if (!this.connectedUsers.has(client.userId)) {
        this.connectedUsers.set(client.userId, []);
      }
      this.connectedUsers.get(client.userId)?.push(client);

      // Entrar nas salas das conversas do usuário
      await this.joinUserConversations(client);

      console.log(`Usuário ${client.userId} conectado ao chat`);
    } catch (error) {
      console.error('Erro na autenticação WebSocket:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        const index = userSockets.indexOf(client);
        if (index > -1) {
          userSockets.splice(index, 1);
        }
        
        if (userSockets.length === 0) {
          this.connectedUsers.delete(client.userId);
        }
      }
      console.log(`Usuário ${client.userId} desconectado do chat`);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      // Verificar se o usuário tem acesso à conversa
      const conversation = await this.conversationsService.findOne(
        data.conversationId,
        client.organizationId!,
        client.userId!,
      );

      if (conversation) {
        client.join(`conversation:${data.conversationId}`);
        client.emit('joined_conversation', { conversationId: data.conversationId });
      } else {
        client.emit('error', { message: 'Acesso negado à conversa' });
      }
    } catch (error) {
      client.emit('error', { message: 'Erro ao entrar na conversa' });
    }
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(`conversation:${data.conversationId}`);
    client.emit('left_conversation', { conversationId: data.conversationId });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto & { sessionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const message = await this.messagesService.sendMessage(
        data,
        data.sessionId,
        client.organizationId!,
        client.userId!,
      );

      // Emitir mensagem para todos os usuários da conversa
      this.server
        .to(`conversation:${message.conversationId}`)
        .emit('new_message', message);

      client.emit('message_sent', { messageId: message.id, success: true });
    } catch (error) {
      client.emit('message_error', { 
        error: error.message,
        chatId: data.chatId 
      });
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId: client.userId,
      conversationId: data.conversationId,
      typing: true,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId: client.userId,
      conversationId: data.conversationId,
      typing: false,
    });
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { conversationId: string; messageIds: string[] },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      await this.messagesService.markAsRead(
        { messageIds: data.messageIds },
        data.conversationId,
        client.userId!,
      );

      // Notificar outros usuários que as mensagens foram lidas
      client.to(`conversation:${data.conversationId}`).emit('messages_read', {
        userId: client.userId,
        conversationId: data.conversationId,
        messageIds: data.messageIds,
      });
    } catch (error) {
      client.emit('error', { message: 'Erro ao marcar como lida' });
    }
  }

  // Métodos públicos para emitir eventos

  async notifyNewMessage(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('new_message', message);
  }

  async notifyMessageUpdate(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('message_updated', message);
  }

  async notifyConversationUpdate(conversationId: string, conversation: any) {
    this.server.to(`conversation:${conversationId}`).emit('conversation_updated', conversation);
  }

  async notifyUserAssigned(conversationId: string, user: any) {
    this.server.to(`conversation:${conversationId}`).emit('user_assigned', {
      conversationId,
      user,
    });
  }

  async notifyUserUnassigned(conversationId: string, userId: string) {
    this.server.to(`conversation:${conversationId}`).emit('user_unassigned', {
      conversationId,
      userId,
    });
  }

  // Notificar usuário específico
  async notifyUser(userId: string, event: string, data: any) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.forEach(socket => {
        socket.emit(event, data);
      });
    }
  }

  // Notificar todos os usuários de uma organização
  async notifyOrganization(organizationId: string, event: string, data: any) {
    for (const [userId, sockets] of this.connectedUsers.entries()) {
      const userSocket = sockets[0]; // Pegar primeiro socket para verificar org
      if (userSocket?.organizationId === organizationId) {
        sockets.forEach(socket => {
          socket.emit(event, data);
        });
      }
    }
  }

  private async joinUserConversations(client: AuthenticatedSocket) {
    try {
      // Buscar conversas do usuário
      const conversations = await this.conversationsService.findAll(
        { page: 1, limit: 1000 },
        client.organizationId!,
        client.userId!,
      );

      // Entrar em todas as salas das conversas
      conversations.data.forEach(conversation => {
        client.join(`conversation:${conversation.id}`);
      });
    } catch (error) {
      console.error('Erro ao entrar nas conversas do usuário:', error);
    }
  }
}

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateMessageDto, 
  UpdateMessageDto, 
  MarkAsReadDto, 
  MessageReactionDto,
  SendMessageDto,
  MessageType,
  MessageStatus 
} from './dto/message.dto';
import { QueryMessagesDto } from './dto/query.dto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsAppService
  ) {}

  async create(dto: CreateMessageDto, organizationId: string, userId: string) {
    // Verificar se a conversa existe e se o usuário tem acesso
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: dto.conversationId,
        organizationId,
        conversationUsers: {
          some: {
            userId,
            canWrite: true,
          },
        },
      },
      include: {
        session: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada ou sem permissão de escrita');
    }

    // Verificar mensagem citada se fornecida
    if (dto.quotedMessageId) {
      const quotedMessage = await this.prisma.message.findFirst({
        where: {
          id: dto.quotedMessageId,
          conversationId: dto.conversationId,
        },
      });

      if (!quotedMessage) {
        throw new BadRequestException('Mensagem citada não encontrada');
      }
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        type: dto.type as any,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        mediaCaption: dto.mediaCaption,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        fromMe: true,
        fromUserId: userId,
        quotedMessageId: dto.quotedMessageId,
        isForwarded: dto.isForwarded || false,
        timestamp: new Date(),
        status: 'PENDING' as any,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quotedMessage: {
          select: {
            id: true,
            content: true,
            type: true,
            fromMe: true,
            fromName: true,
            timestamp: true,
          },
        },
        reactions: true,
      },
    });

    // Atualizar conversa com último momento de mensagem
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    return message;
  }

  async sendMessage(dto: SendMessageDto, sessionId: string, organizationId: string, userId: string) {
    // Verificar se a sessão existe e está ativa
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        id: sessionId,
        organizationId,
        isActive: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Sessão WhatsApp não encontrada ou inativa');
    }

    // Buscar ou criar conversa
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        chatId: dto.chatId,
        sessionId,
        organizationId,
      },
    });

    if (!conversation) {
      // Criar nova conversa
      conversation = await this.prisma.conversation.create({
        data: {
          type: 'CONTACT' as any, // Assumir conversa individual por padrão
          chatId: dto.chatId,
          sessionId,
          organizationId,
          name: dto.chatId, // Usar chatId como nome temporário
        },
      });

      // Atribuir usuário à conversa
      await this.prisma.conversationUser.create({
        data: {
          conversationId: conversation.id,
          userId,
          canRead: true,
          canWrite: true,
          canManage: true,
          isAssigned: true,
        },
      });
    }

    // Criar mensagem local
    const message = await this.create({
      conversationId: conversation.id,
      type: dto.type,
      content: dto.content,
      mediaUrl: dto.mediaUrl,
      mediaCaption: dto.mediaCaption,
      quotedMessageId: dto.quotedMessageId,
    }, organizationId, userId);

    try {
      // Enviar através do WhatsApp
      const whatsappResult = await this.whatsappService.sendMessage(
        sessionId,
        organizationId,
        dto.chatId,
        dto.content || '',
        dto.type,
        dto.mediaUrl
      );

      // Atualizar status da mensagem
      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          messageId: whatsappResult.messageId,
          status: 'SENT' as any,
          sentAt: new Date(),
        },
      });

      return {
        ...message,
        messageId: whatsappResult.messageId,
        status: 'SENT',
        sentAt: new Date(),
      };
    } catch (error) {
      // Atualizar status como falha
      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          status: 'FAILED' as any,
        },
      });

      throw new BadRequestException(`Falha ao enviar mensagem: ${error.message}`);
    }
  }

  async findAll(conversationId: string, query: QueryMessagesDto, organizationId: string, userId?: string) {
    // Verificar acesso à conversa
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        organizationId,
        ...(userId && {
          conversationUsers: {
            some: {
              userId,
              canRead: true,
            },
          },
        }),
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada ou sem permissão de leitura');
    }

    const {
      page = 1,
      limit = 50,
      search,
      type,
      startDate,
      endDate,
      fromMe,
      starred,
      status,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      conversationId,
      isDeleted: false,
    };

    // Filtros opcionais
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { mediaCaption: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (startDate) {
      where.timestamp = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.timestamp = { 
        ...(where.timestamp || {}),
        lte: new Date(endDate) 
      };
    }

    if (fromMe !== undefined) {
      where.fromMe = fromMe;
    }

    if (starred !== undefined) {
      where.isStarred = starred;
    }

    if (status) {
      where.status = status;
    }

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          quotedMessage: {
            select: {
              id: true,
              content: true,
              type: true,
              fromMe: true,
              fromName: true,
              timestamp: true,
            },
          },
          reactions: true,
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      data: messages.reverse(), // Retornar em ordem cronológica
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string, userId?: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id,
        conversation: {
          organizationId,
          ...(userId && {
            conversationUsers: {
              some: {
                userId,
                canRead: true,
              },
            },
          }),
        },
      },
      include: {
        conversation: {
          select: {
            id: true,
            chatId: true,
            name: true,
            type: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quotedMessage: {
          select: {
            id: true,
            content: true,
            type: true,
            fromMe: true,
            fromName: true,
            timestamp: true,
          },
        },
        reactions: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    return message;
  }

  async update(id: string, dto: UpdateMessageDto, organizationId: string, userId?: string) {
    const message = await this.findOne(id, organizationId, userId);

    // Apenas quem enviou pode editar (se for nossa mensagem)
    if (message.fromMe && message.fromUserId !== userId) {
      throw new ForbiddenException('Você não pode editar esta mensagem');
    }

    if (!message.fromMe) {
      throw new ForbiddenException('Não é possível editar mensagens de outros');
    }

    return this.prisma.message.update({
      where: { id },
      data: {
        ...dto,
        editedAt: dto.content ? new Date() : undefined,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quotedMessage: {
          select: {
            id: true,
            content: true,
            type: true,
            fromMe: true,
            fromName: true,
            timestamp: true,
          },
        },
        reactions: true,
      },
    });
  }

  async remove(id: string, organizationId: string, userId?: string) {
    const message = await this.findOne(id, organizationId, userId);

    // Verificar permissões
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: message.conversation.id,
        conversationUsers: {
          some: {
            userId,
            OR: [
              { canManage: true },
              ...(message.fromUserId ? [{ userId: message.fromUserId }] : []), // Próprio autor
            ],
          },
        },
      },
    });

    if (!conversation) {
      throw new ForbiddenException('Você não tem permissão para excluir esta mensagem');
    }

    await this.prisma.message.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { message: 'Mensagem excluída com sucesso' };
  }

  async markAsRead(dto: MarkAsReadDto, conversationId: string, userId: string) {
    // Verificar acesso à conversa
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        conversationUsers: {
          some: {
            userId,
            canRead: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    // Marcar mensagens como lidas
    await this.prisma.message.updateMany({
      where: {
        id: { in: dto.messageIds },
        conversationId,
        fromMe: false, // Apenas mensagens recebidas
      },
      data: {
        readAt: new Date(),
        status: 'READ' as any,
      },
    });

    // Atualizar timestamp de última leitura do usuário
    await this.prisma.conversationUser.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return { message: 'Mensagens marcadas como lidas' };
  }

  async addReaction(messageId: string, dto: MessageReactionDto, organizationId: string, userId: string) {
    const message = await this.findOne(messageId, organizationId, userId);

    // Verificar se já tem reação deste usuário com este emoji
    const existingReaction = await this.prisma.messageReaction.findFirst({
      where: {
        messageId,
        emoji: dto.emoji,
        fromUser: userId,
      },
    });

    if (existingReaction) {
      // Remover reação existente
      await this.prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });
      return { message: 'Reação removida' };
    }

    // Adicionar nova reação
    const reaction = await this.prisma.messageReaction.create({
      data: {
        messageId,
        emoji: dto.emoji,
        fromMe: true,
        fromUser: userId,
      },
    });

    return reaction;
  }

  async getStats(conversationId: string, organizationId: string) {
    const [total, sent, received, media, unread] = await Promise.all([
      this.prisma.message.count({
        where: {
          conversationId,
          conversation: { organizationId },
          isDeleted: false,
        },
      }),
      this.prisma.message.count({
        where: {
          conversationId,
          conversation: { organizationId },
          fromMe: true,
          isDeleted: false,
        },
      }),
      this.prisma.message.count({
        where: {
          conversationId,
          conversation: { organizationId },
          fromMe: false,
          isDeleted: false,
        },
      }),
      this.prisma.message.count({
        where: {
          conversationId,
          conversation: { organizationId },
          type: { in: ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'] },
          isDeleted: false,
        },
      }),
      this.prisma.message.count({
        where: {
          conversationId,
          conversation: { organizationId },
          fromMe: false,
          readAt: null,
          isDeleted: false,
        },
      }),
    ]);

    return {
      total,
      sent,
      received,
      media,
      unread,
    };
  }

  // Método para processar mensagens recebidas do WhatsApp
  async processIncomingMessage(sessionId: string, whatsappMessage: any) {
    try {
      // Buscar ou criar conversa
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          chatId: whatsappMessage.chatId,
          sessionId,
        },
      });

      if (!conversation) {
        // Criar nova conversa
        const session = await this.prisma.whatsAppSession.findUnique({
          where: { id: sessionId },
        });

        conversation = await this.prisma.conversation.create({
          data: {
            type: whatsappMessage.isGroup ? 'GROUP' as any : 'CONTACT' as any,
            chatId: whatsappMessage.chatId,
            name: whatsappMessage.contactName || whatsappMessage.chatId,
            sessionId,
            organizationId: session?.organizationId || '',
          },
        });
      }

      // Criar mensagem
      const message = await this.prisma.message.create({
        data: {
          messageId: whatsappMessage.id,
          conversationId: conversation.id,
          type: this.mapWhatsAppMessageType(whatsappMessage.type),
          content: whatsappMessage.content,
          mediaUrl: whatsappMessage.mediaUrl,
          mediaCaption: whatsappMessage.caption,
          fileName: whatsappMessage.fileName,
          fileSize: whatsappMessage.fileSize,
          mimeType: whatsappMessage.mimeType,
          fromMe: false,
          fromParticipant: whatsappMessage.fromParticipant,
          fromName: whatsappMessage.fromName,
          timestamp: new Date(whatsappMessage.timestamp),
          status: 'DELIVERED' as any,
        },
      });

      // Atualizar conversa
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
        },
      });

      return message;
    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error);
      throw error;
    }
  }

  private mapWhatsAppMessageType(whatsappType: string): any {
    const typeMap = {
      'text': 'TEXT',
      'image': 'IMAGE',
      'audio': 'AUDIO',
      'video': 'VIDEO',
      'document': 'DOCUMENT',
      'location': 'LOCATION',
      'contact': 'CONTACT',
      'sticker': 'STICKER',
      'poll': 'POLL',
    };

    return typeMap[whatsappType] || 'TEXT';
  }
}

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateConversationDto, 
  UpdateConversationDto, 
  AddParticipantsDto, 
  AssignUserDto,
  ConversationType 
} from './dto/conversation.dto';
import { QueryConversationsDto } from './dto/query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateConversationDto, organizationId: string) {
    // Verificar se a sessão pertence à organização
    const session = await this.prisma.whatsAppSession.findFirst({
      where: {
        id: dto.sessionId,
        organizationId,
        isActive: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Sessão WhatsApp não encontrada');
    }

    // Verificar se já existe conversa com este chatId na sessão
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        chatId: dto.chatId,
        sessionId: dto.sessionId,
      },
    });

    if (existingConversation) {
      throw new BadRequestException('Conversa já existe para este chat');
    }

    // Verificar contato se fornecido
    if (dto.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: {
          id: dto.contactId,
          organizationId,
        },
      });

      if (!contact) {
        throw new NotFoundException('Contato não encontrado');
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type: dto.type as any,
        chatId: dto.chatId,
        name: dto.name,
        description: dto.description,
        avatar: dto.avatar,
        sessionId: dto.sessionId,
        contactId: dto.contactId,
        organizationId,
      },
      include: {
        contact: true,
        session: true,
        conversationUsers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        participants: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    // Adicionar usuários com acesso se fornecidos
    if (dto.userIds && dto.userIds.length > 0) {
      await this.assignUsers(conversation.id, dto.userIds, organizationId);
    }

    return conversation;
  }

  async findAll(query: QueryConversationsDto, organizationId: string, userId?: string) {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      archived,
      pinned,
      sessionId,
      unread,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = {
      organizationId,
      isActive: true,
    };

    // Filtros opcionais
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { chatId: { contains: search, mode: 'insensitive' } },
        { contact: { name: { contains: search, mode: 'insensitive' } } },
        { contact: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (type) {
      where.type = type as any;
    }

    if (archived !== undefined) {
      where.isArchived = archived;
    }

    if (pinned !== undefined) {
      where.isPinned = pinned;
    }

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (unread) {
      where.unreadCount = { gt: 0 };
    }

    // Filtrar apenas conversas que o usuário tem acesso (se userId fornecido)
    if (userId) {
      where.conversationUsers = {
        some: {
          userId,
          canRead: true,
        },
      };
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { lastMessageAt: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          session: {
            select: {
              id: true,
              name: true,
              phone: true,
              status: true,
            },
          },
          conversationUsers: {
            where: userId ? { userId } : undefined,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { timestamp: 'desc' },
            select: {
              id: true,
              content: true,
              type: true,
              fromMe: true,
              fromName: true,
              timestamp: true,
              status: true,
            },
          },
          _count: {
            select: {
              messages: true,
              participants: true,
            },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string, userId?: string) {
    const where: Prisma.ConversationWhereInput = {
      id,
      organizationId,
    };

    // Verificar acesso do usuário se fornecido
    if (userId) {
      where.conversationUsers = {
        some: {
          userId,
          canRead: true,
        },
      };
    }

    const conversation = await this.prisma.conversation.findFirst({
      where,
      include: {
        contact: true,
        session: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
        conversationUsers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        participants: true,
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    return conversation;
  }

  async update(id: string, dto: UpdateConversationDto, organizationId: string, userId?: string) {
    // Verificar se existe e se o usuário tem permissão
    const conversation = await this.findOne(id, organizationId, userId);

    // Verificar se o usuário pode gerenciar a conversa
    if (userId) {
      const userAccess = conversation.conversationUsers.find(cu => cu.userId === userId);
      if (!userAccess || !userAccess.canManage) {
        throw new ForbiddenException('Você não tem permissão para editar esta conversa');
      }
    }

    return this.prisma.conversation.update({
      where: { id },
      data: dto,
      include: {
        contact: true,
        session: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
        conversationUsers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        participants: true,
      },
    });
  }

  async remove(id: string, organizationId: string, userId?: string) {
    const conversation = await this.findOne(id, organizationId, userId);

    // Verificar se o usuário pode gerenciar a conversa
    if (userId) {
      const userAccess = conversation.conversationUsers.find(cu => cu.userId === userId);
      if (!userAccess || !userAccess.canManage) {
        throw new ForbiddenException('Você não tem permissão para excluir esta conversa');
      }
    }

    await this.prisma.conversation.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Conversa removida com sucesso' };
  }

  async addParticipants(id: string, dto: AddParticipantsDto, organizationId: string) {
    const conversation = await this.findOne(id, organizationId);

    if (conversation.type !== 'GROUP') {
      throw new BadRequestException('Apenas grupos podem ter participantes adicionados');
    }

    const participants = await Promise.all(
      dto.participants.map(participant =>
        this.prisma.conversationParticipant.upsert({
          where: {
            conversationId_participantId: {
              conversationId: id,
              participantId: participant.participantId,
            },
          },
          update: {
            participantName: participant.participantName,
            participantPhone: participant.participantPhone,
            isAdmin: participant.isAdmin || false,
            leftAt: null, // Se estava fora, agora está dentro
          },
          create: {
            conversationId: id,
            participantId: participant.participantId,
            participantName: participant.participantName,
            participantPhone: participant.participantPhone,
            isAdmin: participant.isAdmin || false,
          },
        })
      )
    );

    return participants;
  }

  async removeParticipant(id: string, participantId: string, organizationId: string) {
    const conversation = await this.findOne(id, organizationId);

    if (conversation.type !== 'GROUP') {
      throw new BadRequestException('Apenas grupos podem ter participantes removidos');
    }

    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId: id,
        participantId,
      },
      data: {
        leftAt: new Date(),
      },
    });

    return { message: 'Participante removido com sucesso' };
  }

  async assignUser(id: string, dto: AssignUserDto, organizationId: string) {
    const conversation = await this.findOne(id, organizationId);

    // Verificar se o usuário existe na organização
    const user = await this.prisma.user.findFirst({
      where: {
        id: dto.userId,
        organizationId,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const conversationUser = await this.prisma.conversationUser.upsert({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: dto.userId,
        },
      },
      update: {
        canRead: dto.canRead ?? true,
        canWrite: dto.canWrite ?? true,
        canManage: dto.canManage ?? false,
        isAssigned: true,
      },
      create: {
        conversationId: id,
        userId: dto.userId,
        canRead: dto.canRead ?? true,
        canWrite: dto.canWrite ?? true,
        canManage: dto.canManage ?? false,
        isAssigned: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return conversationUser;
  }

  async unassignUser(id: string, userId: string, organizationId: string) {
    await this.findOne(id, organizationId);

    await this.prisma.conversationUser.updateMany({
      where: {
        conversationId: id,
        userId,
      },
      data: {
        isAssigned: false,
      },
    });

    return { message: 'Usuário desatribuído com sucesso' };
  }

  async markAsRead(id: string, userId: string, organizationId: string) {
    const conversation = await this.findOne(id, organizationId, userId);

    // Atualizar o último momento de leitura do usuário
    await this.prisma.conversationUser.updateMany({
      where: {
        conversationId: id,
        userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Resetar contador de não lidas se for do usuário
    const userAccess = conversation.conversationUsers.find(cu => cu.userId === userId);
    if (userAccess) {
      await this.prisma.conversation.update({
        where: { id },
        data: {
          unreadCount: Math.max(0, conversation.unreadCount - 1),
        },
      });
    }

    return { message: 'Conversa marcada como lida' };
  }

  async getStats(organizationId: string, userId?: string) {
    const where: Prisma.ConversationWhereInput = {
      organizationId,
      isActive: true,
    };

    if (userId) {
      where.conversationUsers = {
        some: {
          userId,
          canRead: true,
        },
      };
    }

    const [total, unread, pinned, archived] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.count({
        where: { ...where, unreadCount: { gt: 0 } },
      }),
      this.prisma.conversation.count({
        where: { ...where, isPinned: true },
      }),
      this.prisma.conversation.count({
        where: { ...where, isArchived: true },
      }),
    ]);

    return {
      total,
      unread,
      pinned,
      archived,
    };
  }

  private async assignUsers(conversationId: string, userIds: string[], organizationId: string) {
    // Verificar se todos os usuários existem na organização
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        organizationId,
      },
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('Alguns usuários não foram encontrados');
    }

    // Criar relacionamentos
    const conversationUsers = await Promise.all(
      userIds.map(userId =>
        this.prisma.conversationUser.create({
          data: {
            conversationId,
            userId,
            canRead: true,
            canWrite: true,
            canManage: false,
            isAssigned: true,
          },
        })
      )
    );

    return conversationUsers;
  }
}

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto, organizationId: string) {
    // Verificar se já existe uma tag com este nome na organização
    const existingTag = await this.prisma.tag.findFirst({
      where: {
        name: createTagDto.name,
        organizationId,
      },
    });

    if (existingTag) {
      throw new ConflictException('Já existe uma tag com este nome');
    }

    return this.prisma.tag.create({
      data: {
        ...createTagDto,
        organizationId,
      },
      include: {
        _count: {
          select: {
            contactTags: true,
          },
        },
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.tag.findMany({
      where: {
        organizationId,
      },
      include: {
        _count: {
          select: {
            contactTags: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    const tag = await this.prisma.tag.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        _count: {
          select: {
            contactTags: true,
          },
        },
        contactTags: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
          take: 10, // Limitar a 10 contatos para performance
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag não encontrada');
    }

    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto, organizationId: string) {
    // Verificar se a tag existe
    await this.findOne(id, organizationId);

    // Verificar se já existe outra tag com este nome
    if (updateTagDto.name) {
      const existingTag = await this.prisma.tag.findFirst({
        where: {
          name: updateTagDto.name,
          organizationId,
          id: { not: id },
        },
      });

      if (existingTag) {
        throw new ConflictException('Já existe uma tag com este nome');
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
      include: {
        _count: {
          select: {
            contactTags: true,
          },
        },
      },
    });
  }

  async remove(id: string, organizationId: string) {
    // Verificar se a tag existe
    await this.findOne(id, organizationId);

    // Deletar a tag (as associações serão removidas automaticamente devido ao CASCADE)
    await this.prisma.tag.delete({
      where: { id },
    });

    return { message: 'Tag removida com sucesso' };
  }

  async getContactsByTag(tagId: string, organizationId: string, page = 1, limit = 10) {
    // Verificar se a tag existe
    await this.findOne(tagId, organizationId);

    const skip = (page - 1) * limit;

    const [contactTags, total] = await Promise.all([
      this.prisma.contactTag.findMany({
        where: {
          tagId,
          contact: {
            organizationId,
          },
        },
        include: {
          contact: {
            include: {
              contactTags: {
                include: {
                  tag: true,
                },
              },
              _count: {
                select: {
                  messages: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          contact: {
            name: 'asc',
          },
        },
      }),
      this.prisma.contactTag.count({
        where: {
          tagId,
          contact: {
            organizationId,
          },
        },
      }),
    ]);

    return {
      data: contactTags.map(ct => ct.contact),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

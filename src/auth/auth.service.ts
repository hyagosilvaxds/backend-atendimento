import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsService } from './permissions.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private permissionsService: PermissionsService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Verificar se é super admin
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });

    if (superAdmin) {
      const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
      if (isPasswordValid) {
        return {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: UserRole.SUPER_ADMIN,
          isSuperAdmin: true,
        };
      }
    }

    // Verificar usuário comum
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });

    if (user && user.status === UserStatus.ACTIVE) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization,
          isSuperAdmin: false,
        };
      }
    }

    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      organizationId: user.organizationId,
      isSuperAdmin: user.isSuperAdmin || false,
    };

    const token = this.jwtService.sign(payload);

    // Criar sessão
    await this.prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization,
        isSuperAdmin: user.isSuperAdmin || false,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Verificar se organização existe
    const organization = await this.prisma.organization.findUnique({
      where: { id: createUserDto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organização não encontrada');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        role: createUserDto.role || UserRole.ORG_USER,
        organizationId: createUserDto.organizationId,
        status: UserStatus.PENDING,
      },
      include: {
        organization: true,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async findAll(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const updateData: any = { ...updateUserDto };

    // Se senha foi fornecida, fazer hash
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Usuário removido com sucesso' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Por segurança, não revelar se o email existe
      return { message: 'Se o email existir, um link de recuperação será enviado' };
    }

    // Gerar token de reset
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Aqui você implementaria o envio de email
    console.log(`Token de reset para ${user.email}: ${token}`);

    return { message: 'Se o email existir, um link de recuperação será enviado' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: { token: resetPasswordDto.token },
      include: { user: true },
    });

    if (!passwordReset || passwordReset.used || passwordReset.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

    // Atualizar senha do usuário
    await this.prisma.user.update({
      where: { id: passwordReset.userId },
      data: { password: hashedPassword },
    });

    // Marcar token como usado
    await this.prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { used: true },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async logout(token: string) {
    // Remover sessão
    await this.prisma.session.deleteMany({
      where: { token },
    });

    return { message: 'Logout realizado com sucesso' };
  }

  async getProfile(userId: string) {
    const user = await this.findOne(userId);
    const permissions = await this.permissionsService.getUserPermissions(userId);
    
    return {
      ...user,
      permissions: permissions.map(p => ({
        action: p.action,
        resource: p.resource,
        description: p.description,
      })),
    };
  }

  async grantPermission(userId: string, action: any, resource: any) {
    return this.permissionsService.grantPermissionToUser(userId, action, resource);
  }

  async revokePermission(userId: string, action: any, resource: any) {
    return this.permissionsService.revokePermissionFromUser(userId, action, resource);
  }

  async initializePermissions() {
    return this.permissionsService.setupDefaultRolePermissions();
  }
}

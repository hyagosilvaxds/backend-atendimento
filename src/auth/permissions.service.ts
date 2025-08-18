import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionAction, PermissionResource, UserRole } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async hasPermission(
    userId: string,
    action: PermissionAction,
    resource: PermissionResource,
    organizationId?: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) return false;

    // Super Admin tem todas as permissões
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Verificar permissões específicas do usuário
    const userPermission = user.userPermissions.find(
      (up) =>
        up.permission.action === action &&
        up.permission.resource === resource,
    );

    if (userPermission) {
      return userPermission.granted;
    }

    // Verificar permissões por role
    const rolePermission = await this.prisma.rolePermission.findFirst({
      where: {
        role: user.role,
        permission: {
          action,
          resource,
        },
        OR: [
          { organizationId: null }, // Permissão global
          { organizationId: organizationId || user.organizationId },
        ],
      },
    });

    return !!rolePermission;
  }

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) return [];

    // Se for Super Admin, retornar todas as permissões
    if (user.role === UserRole.SUPER_ADMIN) {
      return await this.prisma.permission.findMany();
    }

    // Obter permissões por role
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        role: user.role,
        OR: [
          { organizationId: null },
          { organizationId: user.organizationId },
        ],
      },
      include: {
        permission: true,
      },
    });

    // Combinar com permissões específicas do usuário
    const permissions = new Map();

    // Adicionar permissões da role
    rolePermissions.forEach((rp) => {
      const key = `${rp.permission.action}_${rp.permission.resource}`;
      permissions.set(key, rp.permission);
    });

    // Sobrescrever com permissões específicas do usuário
    user.userPermissions.forEach((up) => {
      const key = `${up.permission.action}_${up.permission.resource}`;
      if (up.granted) {
        permissions.set(key, up.permission);
      } else {
        permissions.delete(key);
      }
    });

    return Array.from(permissions.values());
  }

  async grantPermissionToUser(
    userId: string,
    action: PermissionAction,
    resource: PermissionResource,
  ) {
    // Buscar ou criar a permissão
    let permission = await this.prisma.permission.findUnique({
      where: {
        action_resource: { action, resource },
      },
    });

    if (!permission) {
      permission = await this.prisma.permission.create({
        data: { action, resource },
      });
    }

    // Criar ou atualizar permissão do usuário
    return await this.prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
      update: { granted: true },
      create: {
        userId,
        permissionId: permission.id,
        granted: true,
      },
    });
  }

  async revokePermissionFromUser(
    userId: string,
    action: PermissionAction,
    resource: PermissionResource,
  ) {
    const permission = await this.prisma.permission.findUnique({
      where: {
        action_resource: { action, resource },
      },
    });

    if (!permission) return null;

    return await this.prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
      update: { granted: false },
      create: {
        userId,
        permissionId: permission.id,
        granted: false,
      },
    });
  }

  async setupDefaultRolePermissions() {
    // Definir permissões padrão para cada role
    const rolePermissions = [
      // ORG_ADMIN - Administrador da organização
      { role: UserRole.ORG_ADMIN, action: PermissionAction.MANAGE, resource: PermissionResource.SESSIONS },
      { role: UserRole.ORG_ADMIN, action: PermissionAction.MANAGE, resource: PermissionResource.CONTACTS },
      { role: UserRole.ORG_ADMIN, action: PermissionAction.MANAGE, resource: PermissionResource.MESSAGES },
      { role: UserRole.ORG_ADMIN, action: PermissionAction.MANAGE, resource: PermissionResource.ORG_SETTINGS },
      { role: UserRole.ORG_ADMIN, action: PermissionAction.MANAGE, resource: PermissionResource.ORG_USERS },
      { role: UserRole.ORG_ADMIN, action: PermissionAction.READ, resource: PermissionResource.REPORTS },
      { role: UserRole.ORG_ADMIN, action: PermissionAction.MANAGE, resource: PermissionResource.INTEGRATIONS },
      { role: UserRole.ORG_ADMIN, action: PermissionAction.MANAGE, resource: PermissionResource.WEBHOOKS },
      { role: UserRole.ORG_ADMIN, action: PermissionAction.MANAGE, resource: PermissionResource.AUTOMATIONS },
      { role: UserRole.ORG_ADMIN, action: PermissionAction.MANAGE, resource: PermissionResource.TAGS },
      { role: UserRole.ORG_ADMIN, action: PermissionAction.MANAGE, resource: PermissionResource.DEPARTMENTS },
      { role: UserRole.ORG_ADMIN, action: PermissionAction.MANAGE, resource: PermissionResource.QUEUES },

      // ORG_USER - Usuário comum
      { role: UserRole.ORG_USER, action: PermissionAction.CREATE, resource: PermissionResource.SESSIONS },
      { role: UserRole.ORG_USER, action: PermissionAction.READ, resource: PermissionResource.SESSIONS },
      { role: UserRole.ORG_USER, action: PermissionAction.UPDATE, resource: PermissionResource.SESSIONS },
      { role: UserRole.ORG_USER, action: PermissionAction.CREATE, resource: PermissionResource.CONTACTS },
      { role: UserRole.ORG_USER, action: PermissionAction.READ, resource: PermissionResource.CONTACTS },
      { role: UserRole.ORG_USER, action: PermissionAction.UPDATE, resource: PermissionResource.CONTACTS },
      { role: UserRole.ORG_USER, action: PermissionAction.CREATE, resource: PermissionResource.MESSAGES },
      { role: UserRole.ORG_USER, action: PermissionAction.READ, resource: PermissionResource.MESSAGES },
      { role: UserRole.ORG_USER, action: PermissionAction.READ, resource: PermissionResource.TAGS },

      // ORG_VIEWER - Apenas visualização
      { role: UserRole.ORG_VIEWER, action: PermissionAction.READ, resource: PermissionResource.SESSIONS },
      { role: UserRole.ORG_VIEWER, action: PermissionAction.READ, resource: PermissionResource.CONTACTS },
      { role: UserRole.ORG_VIEWER, action: PermissionAction.READ, resource: PermissionResource.MESSAGES },
      { role: UserRole.ORG_VIEWER, action: PermissionAction.READ, resource: PermissionResource.TAGS },
    ];

    for (const rp of rolePermissions) {
      // Criar permissão se não existir
      let permission = await this.prisma.permission.findUnique({
        where: {
          action_resource: { action: rp.action, resource: rp.resource },
        },
      });

      if (!permission) {
        permission = await this.prisma.permission.create({
          data: {
            action: rp.action,
            resource: rp.resource,
            description: `${rp.action} ${rp.resource}`,
          },
        });
      }

      // Criar permissão da role se não existir
      const existingRolePermission = await this.prisma.rolePermission.findFirst({
        where: {
          role: rp.role,
          permissionId: permission.id,
          organizationId: null,
        },
      });

      if (!existingRolePermission) {
        await this.prisma.rolePermission.create({
          data: {
            role: rp.role,
            permissionId: permission.id,
            organizationId: null,
          },
        });
      }
    }
  }
}

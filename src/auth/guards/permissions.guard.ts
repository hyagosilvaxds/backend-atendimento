import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import { PermissionAction, PermissionResource } from '@prisma/client';

export interface RequiredPermission {
  action: PermissionAction;
  resource: PermissionResource;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verificar se o usuário tem pelo menos uma das permissões necessárias
    for (const permission of requiredPermissions) {
      const hasPermission = await this.permissionsService.hasPermission(
        user.id,
        permission.action,
        permission.resource,
        user.organizationId,
      );

      if (hasPermission) {
        return true;
      }
    }

    throw new ForbiddenException('Permissão insuficiente para acessar este recurso');
  }
}

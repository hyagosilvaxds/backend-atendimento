import { PrismaClient, PermissionAction, PermissionResource, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function addWarmupPermissions() {
  console.log('Adicionando permissões de aquecimento...');

  // Criar permissões para WARMUP_CAMPAIGNS
  const warmupPermissions = [
    {
      action: PermissionAction.CREATE,
      resource: PermissionResource.WARMUP_CAMPAIGNS,
      description: 'Criar campanhas de aquecimento',
    },
    {
      action: PermissionAction.READ,
      resource: PermissionResource.WARMUP_CAMPAIGNS,
      description: 'Visualizar campanhas de aquecimento',
    },
    {
      action: PermissionAction.UPDATE,
      resource: PermissionResource.WARMUP_CAMPAIGNS,
      description: 'Atualizar campanhas de aquecimento',
    },
    {
      action: PermissionAction.DELETE,
      resource: PermissionResource.WARMUP_CAMPAIGNS,
      description: 'Deletar campanhas de aquecimento',
    },
    {
      action: PermissionAction.MANAGE,
      resource: PermissionResource.WARMUP_CAMPAIGNS,
      description: 'Gerenciar campanhas de aquecimento',
    },
  ];

  // Criar ou atualizar permissões
  for (const permission of warmupPermissions) {
    await prisma.permission.upsert({
      where: {
        action_resource: {
          action: permission.action,
          resource: permission.resource,
        },
      },
      create: permission,
      update: {
        description: permission.description,
      },
    });
    console.log(`✓ Permissão criada: ${permission.action} ${permission.resource}`);
  }

  // Buscar IDs das permissões criadas
  const createdPermissions = await prisma.permission.findMany({
    where: {
      resource: PermissionResource.WARMUP_CAMPAIGNS,
    },
  });

  // Adicionar permissões aos roles
  const rolePermissions = [
    // SUPER_ADMIN - todas as permissões
    ...createdPermissions.map(permission => ({
      role: UserRole.SUPER_ADMIN,
      permissionId: permission.id,
      organizationId: null as string | null, // Global
    })),
    // ORG_ADMIN - todas as permissões
    ...createdPermissions.map(permission => ({
      role: UserRole.ORG_ADMIN,
      permissionId: permission.id,
      organizationId: null as string | null, // Para todas as organizações
    })),
    // ORG_USER - apenas READ e UPDATE
    ...createdPermissions
      .filter(p => p.action === PermissionAction.READ || p.action === PermissionAction.UPDATE)
      .map(permission => ({
        role: UserRole.ORG_USER,
        permissionId: permission.id,
        organizationId: null as string | null,
      })),
    // ORG_VIEWER - apenas READ
    ...createdPermissions
      .filter(p => p.action === PermissionAction.READ)
      .map(permission => ({
        role: UserRole.ORG_VIEWER,
        permissionId: permission.id,
        organizationId: null as string | null,
      })),
  ];

  // Criar role permissions
  for (const rolePermission of rolePermissions) {
    try {
      await prisma.rolePermission.create({
        data: {
          role: rolePermission.role,
          permissionId: rolePermission.permissionId,
          organizationId: rolePermission.organizationId,
        },
      });
    } catch (error) {
      // Ignorar erros de duplicação
      console.log(`Permissão já existe: ${rolePermission.role} - ${rolePermission.permissionId}`);
    }
  }

  console.log('✓ Permissões de role criadas para warmup campaigns');
  console.log('\nPermissões de aquecimento adicionadas com sucesso!');
}

addWarmupPermissions()
  .catch((e) => {
    console.error('Erro ao adicionar permissões:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

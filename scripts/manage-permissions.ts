import { PrismaClient, PermissionAction, PermissionResource, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const ACTIONS: PermissionAction[] = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'];

const RESOURCES: PermissionResource[] = [
  'SESSIONS',
  'CONTACTS',
  'MESSAGES',
  'ORG_SETTINGS',
  'ORG_USERS',
  'REPORTS',
  'INTEGRATIONS',
  'WEBHOOKS',
  'AUTOMATIONS',
  'TAGS',
  'DEPARTMENTS',
  'QUEUES',
  'WHATSAPP_SESSIONS'
];

export async function createPermission(action: PermissionAction, resource: PermissionResource, description?: string) {
  try {
    const permission = await prisma.permission.create({
      data: {
        action,
        resource,
        description: description || `${action} ${resource}`,
      },
    });
    console.log(`✅ Permissão criada: ${permission.action} ${permission.resource}`);
    return permission;
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`⚠️  Permissão já existe: ${action} ${resource}`);
      return await prisma.permission.findUnique({
        where: {
          action_resource: {
            action,
            resource,
          },
        },
      });
    }
    throw error;
  }
}

export async function createAllPermissions() {
  console.log('🚀 Criando todas as permissões...\n');
  
  const permissions: any[] = [];
  
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const permission = await createPermission(action, resource);
      if (permission) {
        permissions.push(permission);
      }
    }
  }
  
  console.log(`\n✅ Total de permissões criadas/verificadas: ${permissions.length}`);
  return permissions;
}

export async function assignPermissionToRole(role: UserRole, permissionId: string, organizationId?: string) {
  try {
    const rolePermission = await prisma.rolePermission.create({
      data: {
        role,
        permissionId,
        organizationId,
      },
    });
    console.log(`✅ Permissão ${permissionId} atribuída ao role ${role}`);
    return rolePermission;
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`⚠️  Permissão já atribuída ao role`);
      return null;
    }
    throw error;
  }
}

export async function assignAllPermissionsToRole(roleName: UserRole) {
  console.log(`🚀 Atribuindo permissões ao role: ${roleName}...\n`);
  
  const permissions = await prisma.permission.findMany();
  
  let assignedCount = 0;
  
  for (const permission of permissions) {
    // Lógica para determinar quais permissões cada role deve ter
    let shouldAssign = false;
    
    switch (roleName) {
      case 'SUPER_ADMIN':
        shouldAssign = true; // Super admin tem todas as permissões
        break;
        
      case 'ORG_ADMIN':
        // Org admin tem quase todas as permissões da organização
        shouldAssign = true;
        break;
        
      case 'ORG_USER':
        // Usuário da organização tem permissões limitadas
        shouldAssign = ['SESSIONS', 'CONTACTS', 'MESSAGES', 'WHATSAPP_SESSIONS', 'TAGS'].includes(permission.resource) &&
                      !['DELETE', 'MANAGE'].includes(permission.action);
        break;
        
      case 'ORG_VIEWER':
        // Visualizador tem apenas leitura limitada
        shouldAssign = ['SESSIONS', 'CONTACTS', 'MESSAGES', 'REPORTS'].includes(permission.resource) &&
                      ['READ'].includes(permission.action);
        break;
    }
    
    if (shouldAssign) {
      await assignPermissionToRole(roleName, permission.id);
      assignedCount++;
    }
  }
  
  console.log(`\n✅ Total de permissões atribuídas ao ${roleName}: ${assignedCount}`);
}

export async function createWhatsAppPermissions() {
  console.log('🚀 Criando permissões específicas do WhatsApp...\n');
  
  const whatsappActions: PermissionAction[] = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'];
  const whatsappPermissions: any[] = [];
  
  for (const action of whatsappActions) {
    const permission = await createPermission(action, 'WHATSAPP_SESSIONS', 
      `${action} WhatsApp sessions - manage WhatsApp connections and QR codes`);
    if (permission) {
      whatsappPermissions.push(permission);
    }
  }
  
  return whatsappPermissions;
}

export async function assignWhatsAppPermissionsToAdmins() {
  console.log('🚀 Atribuindo permissões do WhatsApp aos administradores...\n');
  
  const whatsappPermissions = await prisma.permission.findMany({
    where: { resource: 'WHATSAPP_SESSIONS' },
  });
  
  const adminRoles: UserRole[] = ['SUPER_ADMIN', 'ORG_ADMIN'];
  
  for (const role of adminRoles) {
    for (const permission of whatsappPermissions) {
      await assignPermissionToRole(role, permission.id);
    }
  }
  
  console.log('✅ Permissões do WhatsApp atribuídas aos administradores');
}

// Função principal para executar operações específicas
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'create-all':
        await createAllPermissions();
        break;
        
      case 'create-whatsapp':
        await createWhatsAppPermissions();
        break;
        
      case 'assign-whatsapp-admins':
        await assignWhatsAppPermissionsToAdmins();
        break;
        
      case 'assign-all-super-admin':
        await assignAllPermissionsToRole('SUPER_ADMIN');
        break;
        
      case 'assign-all-org-admin':
        await assignAllPermissionsToRole('ORG_ADMIN');
        break;
        
      case 'assign-all-org-user':
        await assignAllPermissionsToRole('ORG_USER');
        break;
        
      case 'assign-all-org-viewer':
        await assignAllPermissionsToRole('ORG_VIEWER');
        break;
        
      case 'setup-complete':
        console.log('🚀 Configuração completa do sistema de permissões...\n');
        await createAllPermissions();
        await assignAllPermissionsToRole('SUPER_ADMIN');
        await assignAllPermissionsToRole('ORG_ADMIN');
        await assignAllPermissionsToRole('ORG_USER');
        await assignAllPermissionsToRole('ORG_VIEWER');
        console.log('\n🎉 Sistema de permissões configurado com sucesso!');
        break;
        
      default:
        console.log('Comandos disponíveis:');
        console.log('  create-all                 - Criar todas as permissões');
        console.log('  create-whatsapp            - Criar apenas permissões do WhatsApp');
        console.log('  assign-whatsapp-admins     - Atribuir permissões WhatsApp aos admins');
        console.log('  assign-all-super-admin     - Atribuir todas as permissões ao SUPER_ADMIN');
        console.log('  assign-all-org-admin       - Atribuir permissões ao ORG_ADMIN');
        console.log('  assign-all-org-user        - Atribuir permissões ao ORG_USER');
        console.log('  assign-all-org-viewer      - Atribuir permissões ao ORG_VIEWER');
        console.log('  setup-complete             - Configuração completa (recomendado)');
        break;
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setupPermissions() {
  console.log('Configurando permissões...');

  // Primeiro, criar todas as permissões básicas
  const permissions = [
    // Sessões
    { action: 'CREATE', resource: 'SESSIONS', description: 'Criar sessões de atendimento' },
    { action: 'READ', resource: 'SESSIONS', description: 'Visualizar sessões de atendimento' },
    { action: 'UPDATE', resource: 'SESSIONS', description: 'Atualizar sessões de atendimento' },
    { action: 'DELETE', resource: 'SESSIONS', description: 'Excluir sessões de atendimento' },
    { action: 'MANAGE', resource: 'SESSIONS', description: 'Gerenciar completamente sessões de atendimento' },
    
    // Contatos
    { action: 'CREATE', resource: 'CONTACTS', description: 'Criar contatos' },
    { action: 'READ', resource: 'CONTACTS', description: 'Visualizar contatos' },
    { action: 'UPDATE', resource: 'CONTACTS', description: 'Atualizar contatos' },
    { action: 'DELETE', resource: 'CONTACTS', description: 'Excluir contatos' },
    { action: 'MANAGE', resource: 'CONTACTS', description: 'Gerenciar completamente contatos' },
    
    // Mensagens
    { action: 'CREATE', resource: 'MESSAGES', description: 'Criar mensagens' },
    { action: 'READ', resource: 'MESSAGES', description: 'Visualizar mensagens' },
    { action: 'UPDATE', resource: 'MESSAGES', description: 'Atualizar mensagens' },
    { action: 'DELETE', resource: 'MESSAGES', description: 'Excluir mensagens' },
    
    // Conversações
    { action: 'CREATE', resource: 'CONVERSATIONS', description: 'Criar conversações' },
    { action: 'READ', resource: 'CONVERSATIONS', description: 'Visualizar conversações' },
    { action: 'UPDATE', resource: 'CONVERSATIONS', description: 'Atualizar conversações' },
    { action: 'DELETE', resource: 'CONVERSATIONS', description: 'Excluir conversações' },
    { action: 'MANAGE', resource: 'CONVERSATIONS', description: 'Gerenciar completamente conversações' },
    
    // Configurações da organização
    { action: 'MANAGE', resource: 'ORG_SETTINGS', description: 'Gerenciar configurações da organização' },
    { action: 'MANAGE', resource: 'ORG_USERS', description: 'Gerenciar usuários da organização' },
    
    // Relatórios
    { action: 'READ', resource: 'REPORTS', description: 'Visualizar relatórios' },
    
    // Integrações
    { action: 'MANAGE', resource: 'INTEGRATIONS', description: 'Gerenciar integrações' },
    
    // Tags
    { action: 'READ', resource: 'TAGS', description: 'Visualizar tags' },
    { action: 'MANAGE', resource: 'TAGS', description: 'Gerenciar tags' },
    
    // Sessões WhatsApp
    { action: 'CREATE', resource: 'WHATSAPP_SESSIONS', description: 'Criar sessões WhatsApp' },
    { action: 'READ', resource: 'WHATSAPP_SESSIONS', description: 'Visualizar sessões WhatsApp' },
    { action: 'UPDATE', resource: 'WHATSAPP_SESSIONS', description: 'Atualizar sessões WhatsApp' },
    { action: 'DELETE', resource: 'WHATSAPP_SESSIONS', description: 'Excluir sessões WhatsApp' },
    { action: 'MANAGE', resource: 'WHATSAPP_SESSIONS', description: 'Gerenciar completamente sessões WhatsApp' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        action_resource: {
          action: perm.action as any,
          resource: perm.resource as any,
        },
      },
      update: {},
      create: {
        action: perm.action as any,
        resource: perm.resource as any,
        description: perm.description,
      },
    });
  }

  // Configurar permissões para roles
  const rolePermissions = [
    // ORG_ADMIN - Todas as permissões da organização
    { role: 'ORG_ADMIN', action: 'MANAGE', resource: 'SESSIONS' },
    { role: 'ORG_ADMIN', action: 'MANAGE', resource: 'CONTACTS' },
        { role: 'ORG_ADMIN', action: 'CREATE', resource: 'MESSAGES' },
    { role: 'ORG_ADMIN', action: 'READ', resource: 'MESSAGES' },
    { role: 'ORG_ADMIN', action: 'UPDATE', resource: 'MESSAGES' },
    { role: 'ORG_ADMIN', action: 'DELETE', resource: 'MESSAGES' },
    { role: 'ORG_ADMIN', action: 'MANAGE', resource: 'CONVERSATIONS' },
    { role: 'ORG_ADMIN', action: 'CREATE', resource: 'CONVERSATIONS' },
    { role: 'ORG_ADMIN', action: 'READ', resource: 'CONVERSATIONS' },
    { role: 'ORG_ADMIN', action: 'UPDATE', resource: 'CONVERSATIONS' },
    { role: 'ORG_ADMIN', action: 'DELETE', resource: 'CONVERSATIONS' },,
    { role: 'ORG_ADMIN', action: 'MANAGE', resource: 'ORG_SETTINGS' },
    { role: 'ORG_ADMIN', action: 'MANAGE', resource: 'ORG_USERS' },
    { role: 'ORG_ADMIN', action: 'READ', resource: 'REPORTS' },
    { role: 'ORG_ADMIN', action: 'MANAGE', resource: 'INTEGRATIONS' },
    { role: 'ORG_ADMIN', action: 'MANAGE', resource: 'TAGS' },
    { role: 'ORG_ADMIN', action: 'MANAGE', resource: 'WHATSAPP_SESSIONS' },

    // ORG_USER - Permissões operacionais
    { role: 'ORG_USER', action: 'CREATE', resource: 'SESSIONS' },
    { role: 'ORG_USER', action: 'READ', resource: 'SESSIONS' },
    { role: 'ORG_USER', action: 'UPDATE', resource: 'SESSIONS' },
    { role: 'ORG_USER', action: 'CREATE', resource: 'CONTACTS' },
    { role: 'ORG_USER', action: 'READ', resource: 'CONTACTS' },
    { role: 'ORG_USER', action: 'UPDATE', resource: 'CONTACTS' },
    { role: 'ORG_USER', action: 'CREATE', resource: 'MESSAGES' },
    { role: 'ORG_USER', action: 'READ', resource: 'MESSAGES' },
    { role: 'ORG_USER', action: 'CREATE', resource: 'CONVERSATIONS' },
    { role: 'ORG_USER', action: 'READ', resource: 'CONVERSATIONS' },
    { role: 'ORG_USER', action: 'UPDATE', resource: 'CONVERSATIONS' },
    { role: 'ORG_USER', action: 'READ', resource: 'TAGS' },
    { role: 'ORG_USER', action: 'CREATE', resource: 'WHATSAPP_SESSIONS' },
    { role: 'ORG_USER', action: 'READ', resource: 'WHATSAPP_SESSIONS' },
    { role: 'ORG_USER', action: 'UPDATE', resource: 'WHATSAPP_SESSIONS' },

    // ORG_VIEWER - Apenas visualização
    { role: 'ORG_VIEWER', action: 'READ', resource: 'SESSIONS' },
    { role: 'ORG_VIEWER', action: 'READ', resource: 'CONTACTS' },
    { role: 'ORG_VIEWER', action: 'READ', resource: 'MESSAGES' },
    { role: 'ORG_VIEWER', action: 'READ', resource: 'CONVERSATIONS' },
    { role: 'ORG_VIEWER', action: 'READ', resource: 'TAGS' },
    { role: 'ORG_VIEWER', action: 'READ', resource: 'WHATSAPP_SESSIONS' },
  ];

  for (const rp of rolePermissions) {
    if (!rp || !rp.action || !rp.resource || !rp.role) {
      console.warn('Permissão inválida encontrada, pulando...', rp);
      continue;
    }

    const permission = await prisma.permission.findUnique({
      where: {
        action_resource: {
          action: rp.action as any,
          resource: rp.resource as any,
        },
      },
    });

    if (permission) {
      const existing = await prisma.rolePermission.findFirst({
        where: {
          role: rp.role as any,
          permissionId: permission.id,
          organizationId: null,
        },
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            role: rp.role as any,
            permissionId: permission.id,
            organizationId: null,
          },
        });
      }
    }
  }

  console.log('Permissões configuradas com sucesso!');
}

async function main() {
  console.log('Iniciando seeds...');

  // Configurar permissões primeiro
  await setupPermissions();

  // Criar Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      email: 'admin@sistema.com',
      password: hashedPassword,
      name: 'Super Administrador',
    },
  });

  console.log('Super Admin criado:', superAdmin);

  // Criar organização de exemplo
  const organization = await prisma.organization.upsert({
    where: { slug: 'empresa-exemplo' },
    update: {},
    create: {
      name: 'Empresa Exemplo',
      slug: 'empresa-exemplo',
      description: 'Organização de exemplo para testes',
      status: 'ACTIVE',
    },
  });

  console.log('Organização criada:', organization);

  // Criar admin da organização
  const orgAdminPassword = await bcrypt.hash('admin123', 10);
  
  const orgAdmin = await prisma.user.upsert({
    where: { email: 'admin@empresa.com' },
    update: {},
    create: {
      email: 'admin@empresa.com',
      password: orgAdminPassword,
      name: 'Admin da Empresa',
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      organizationId: organization.id,
    },
  });

  console.log('Admin da organização criado:', orgAdmin);

  // Criar usuário comum da organização
  const userPassword = await bcrypt.hash('user123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'usuario@empresa.com' },
    update: {},
    create: {
      email: 'usuario@empresa.com',
      password: userPassword,
      name: 'Usuário Comum',
      role: 'ORG_USER',
      status: 'ACTIVE',
      emailVerified: true,
      organizationId: organization.id,
    },
  });

  console.log('Usuário comum criado:', user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

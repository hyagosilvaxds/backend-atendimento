import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addWhatsAppPermissions() {
  console.log('Adicionando permissões de WhatsApp...');

  // Buscar a permissão MANAGE WHATSAPP_SESSIONS
  const whatsappPermission = await prisma.permission.findUnique({
    where: {
      action_resource: {
        action: 'MANAGE',
        resource: 'WHATSAPP_SESSIONS',
      },
    },
  });

  if (!whatsappPermission) {
    console.log('Permissão MANAGE WHATSAPP_SESSIONS não encontrada!');
    return;
  }

  // Adicionar permissão para role ORG_ADMIN
  const existingPermission = await prisma.rolePermission.findFirst({
    where: {
      role: 'ORG_ADMIN',
      permissionId: whatsappPermission.id,
    },
  });

  if (!existingPermission) {
    await prisma.rolePermission.create({
      data: {
        role: 'ORG_ADMIN',
        permissionId: whatsappPermission.id,
      },
    });
    console.log('Permissão MANAGE WHATSAPP_SESSIONS adicionada para ORG_ADMIN');
  } else {
    console.log('Permissão já existe para ORG_ADMIN');
  }

  console.log('Permissões de WhatsApp adicionadas com sucesso!');
}

addWhatsAppPermissions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

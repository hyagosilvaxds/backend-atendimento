import { SetMetadata } from '@nestjs/common';
import { PermissionAction, PermissionResource } from '@prisma/client';
import { RequiredPermission } from '../guards/permissions.guard';

export const RequirePermissions = (...permissions: RequiredPermission[]) => 
  SetMetadata('permissions', permissions);

// Helper functions para facilitar o uso
export const CanCreateSessions = () => 
  RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.SESSIONS });

export const CanReadSessions = () => 
  RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.SESSIONS });

export const CanUpdateSessions = () => 
  RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.SESSIONS });

export const CanDeleteSessions = () => 
  RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.SESSIONS });

export const CanManageSessions = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.SESSIONS });

export const CanCreateContacts = () => 
  RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.CONTACTS });

export const CanReadContacts = () => 
  RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.CONTACTS });

export const CanUpdateContacts = () => 
  RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.CONTACTS });

export const CanDeleteContacts = () => 
  RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.CONTACTS });

export const CanManageContacts = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.CONTACTS });

export const CanCreateMessages = () => 
  RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.MESSAGES });

export const CanReadMessages = () => 
  RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.MESSAGES });

export const CanUpdateMessages = () => 
  RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.MESSAGES });

export const CanDeleteMessages = () => 
  RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.MESSAGES });

export const CanManageMessages = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.MESSAGES });

// Permissões para Conversações
export const CanCreateConversations = () => 
  RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.CONVERSATIONS });

export const CanReadConversations = () => 
  RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.CONVERSATIONS });

export const CanUpdateConversations = () => 
  RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.CONVERSATIONS });

export const CanDeleteConversations = () => 
  RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.CONVERSATIONS });

export const CanManageConversations = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.CONVERSATIONS });

export const CanManageOrgSettings = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.ORG_SETTINGS });

export const CanManageOrgUsers = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.ORG_USERS });

export const CanReadReports = () => 
  RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.REPORTS });

export const CanManageIntegrations = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.INTEGRATIONS });

export const CanManageWebhooks = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.WEBHOOKS });

export const CanManageAutomations = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.AUTOMATIONS });

export const CanManageTags = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.TAGS });

export const CanCreateWhatsAppSessions = () => 
  RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.WHATSAPP_SESSIONS });

export const CanReadWhatsAppSessions = () => 
  RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.WHATSAPP_SESSIONS });

export const CanUpdateWhatsAppSessions = () => 
  RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.WHATSAPP_SESSIONS });

export const CanDeleteWhatsAppSessions = () => 
  RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.WHATSAPP_SESSIONS });

export const CanManageWhatsAppSessions = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.WHATSAPP_SESSIONS });

// Permissões para Warmup Campaigns
export const CanCreateWarmupCampaigns = () => 
  RequirePermissions({ action: PermissionAction.CREATE, resource: PermissionResource.WARMUP_CAMPAIGNS });

export const CanReadWarmupCampaigns = () => 
  RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.WARMUP_CAMPAIGNS });

export const CanUpdateWarmupCampaigns = () => 
  RequirePermissions({ action: PermissionAction.UPDATE, resource: PermissionResource.WARMUP_CAMPAIGNS });

export const CanDeleteWarmupCampaigns = () => 
  RequirePermissions({ action: PermissionAction.DELETE, resource: PermissionResource.WARMUP_CAMPAIGNS });

export const CanManageWarmupCampaigns = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.WARMUP_CAMPAIGNS });

export const CanReadTags = () => 
  RequirePermissions({ action: PermissionAction.READ, resource: PermissionResource.TAGS });

export const CanManageDepartments = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.DEPARTMENTS });

export const CanManageQueues = () => 
  RequirePermissions({ action: PermissionAction.MANAGE, resource: PermissionResource.QUEUES });

import { Injectable } from '@nestjs/common';
import { ConversationsGateway } from '../conversations/conversations.gateway';

@Injectable()
export class ConversationEventsService {
  constructor(private conversationsGateway: ConversationsGateway) {}

  async notifyNewMessage(conversationId: string, message: any) {
    await this.conversationsGateway.notifyNewMessage(conversationId, message);
  }

  async notifyMessageUpdate(conversationId: string, message: any) {
    await this.conversationsGateway.notifyMessageUpdate(conversationId, message);
  }

  async notifyConversationUpdate(conversationId: string, conversation: any) {
    await this.conversationsGateway.notifyConversationUpdate(conversationId, conversation);
  }

  async notifyUserAssigned(conversationId: string, user: any) {
    await this.conversationsGateway.notifyUserAssigned(conversationId, user);
  }

  async notifyUserUnassigned(conversationId: string, userId: string) {
    await this.conversationsGateway.notifyUserUnassigned(conversationId, userId);
  }

  async notifyUser(userId: string, event: string, data: any) {
    await this.conversationsGateway.notifyUser(userId, event, data);
  }

  async notifyOrganization(organizationId: string, event: string, data: any) {
    await this.conversationsGateway.notifyOrganization(organizationId, event, data);
  }
}

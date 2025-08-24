import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ConversationsGateway } from './conversations.gateway';
import { ConversationEventsService } from './conversation-events.service';
import { WhatsAppIntegrationService } from './whatsapp-integration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, AuthModule, WhatsAppModule, JwtModule],
  controllers: [ConversationsController, MessagesController],
  providers: [
    ConversationsService, 
    MessagesService, 
    ConversationsGateway, 
    ConversationEventsService,
    WhatsAppIntegrationService
  ],
  exports: [
    ConversationsService, 
    MessagesService, 
    ConversationEventsService,
    ConversationsGateway,
    WhatsAppIntegrationService
  ],
})
export class ConversationsModule {}

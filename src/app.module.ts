import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SessionsModule } from './sessions/sessions.module';
import { ContactsModule } from './contacts/contacts.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { WarmupModule } from './warmup/warmup.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TestModule } from './test/test.module';
import { ConversationsModule } from './conversations/conversations.module';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    SessionsModule, 
    ContactsModule, 
    WhatsAppModule, 
    WarmupModule,
    NotificationsModule,
    TestModule,
    ConversationsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

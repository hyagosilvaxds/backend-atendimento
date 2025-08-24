import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { TagsService } from './tags.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [AuthModule, PrismaModule, WhatsAppModule],
  controllers: [ContactsController],
  providers: [ContactsService, TagsService],
  exports: [ContactsService, TagsService],
})
export class ContactsModule {}

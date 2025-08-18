import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SessionsModule } from './sessions/sessions.module';
import { ContactsModule } from './contacts/contacts.module';

@Module({
  imports: [PrismaModule, AuthModule, SessionsModule, ContactsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

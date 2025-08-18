import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ContactsController],
})
export class ContactsModule {}

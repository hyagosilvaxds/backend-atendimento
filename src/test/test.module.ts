import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TestController } from './test.controller';
import { ContactsModule } from '../contacts/contacts.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ContactsModule, 
    PrismaModule,
    MulterModule.register({
      storage: require('multer').memoryStorage(), // Usar memoryStorage para manter em buffer
    }),
  ],
  controllers: [TestController],
})
export class TestModule {}

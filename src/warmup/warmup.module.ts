import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MulterModule } from '@nestjs/platform-express';
import { WarmupController } from './warmup.controller';
import { WarmupService } from './warmup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NotificationsModule,
    WhatsAppModule,
    ScheduleModule.forRoot(),
    MulterModule.register({
      dest: './uploads/warmup',
    }),
  ],
  controllers: [WarmupController],
  providers: [WarmupService],
  exports: [WarmupService],
})
export class WarmupModule {}

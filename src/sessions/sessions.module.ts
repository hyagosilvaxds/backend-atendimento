import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SessionsController],
})
export class SessionsModule {}

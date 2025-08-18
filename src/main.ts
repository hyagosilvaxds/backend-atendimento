import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar pipes globais
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configurar CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();

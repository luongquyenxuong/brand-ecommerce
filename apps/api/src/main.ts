import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'http://localhost:3000',
  });

  app.enableShutdownHooks();

  await app.listen(4000, '127.0.0.1');

  Logger.log('API running at http://localhost:4000/api', 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start API:', error);
  process.exitCode = 1;
});

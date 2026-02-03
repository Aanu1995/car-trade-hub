import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger();

  const app = await NestFactory.create(AppModule);

  app.enableCors(); // Enable CORS for all origins by default

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);

  logger.log(`Application is running on port: ${port}`);
}

bootstrap();

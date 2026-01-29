import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // Enable CORS for all origins by default

  const configService = app.get(ConfigService);

  const port = configService.get<string>('PORT');

  await app.listen(port ?? 3000);
}

bootstrap();

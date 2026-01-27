import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieSession from 'cookie-session';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // Enable CORS for all origins by default

  const configService = app.get(ConfigService);

  // Setup Helmet for security headers
  app.use(helmet());

  // Setup cookie session
  app.use(
    cookieSession({
      keys: [configService.get<string>('COOKIE_KEY')!],
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    }),
  );

  // Setup global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const port = configService.get<string>('PORT');

  await app.listen(port ?? 3000);
}

bootstrap();

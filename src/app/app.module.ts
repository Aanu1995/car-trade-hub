import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from 'src/users/users.module';
import { ReportsModule } from 'src/reports/reports.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Report } from 'src/reports/report.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import helmet from 'helmet';
import cookieSession from 'cookie-session';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('DATABASE_NAME'),
        entities: [User, Report],
        synchronize: true,
      }),
    }),
    UsersModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    // Setup global validation pipe
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true }) },

    AppService,
  ],
})
export class AppModule {
  constructor(private readonly configService: ConfigService) {}

  // configure middleware
  configure(consumer: MiddlewareConsumer) {
    // Setup Helmet for security headers
    consumer.apply(helmet()).forRoutes('*');

    // Setup cookie session
    consumer
      .apply(
        cookieSession({
          keys: [this.configService.get<string>('COOKIE_KEY')!],
          maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
        }),
      )
      .forRoutes('*');
  }
}

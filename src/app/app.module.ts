import { MiddlewareConsumer, Module, ValidationPipe } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { ReportsModule } from 'src/reports/reports.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import helmet from 'helmet';

@Module({
  imports: [
    // Setup ConfigModule to read .env files
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),

    // Setup TypeOrmModule to connect to the database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        database: configService.get<string>('DATABASE_NAME'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    UsersModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [
    // Setup global validation pipe
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true }) },
  ],
})
export class AppModule {
  // configure middleware
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        // Setup Helmet for security headers
        helmet(),
      )
      .forRoutes('*');
  }
}

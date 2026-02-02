import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthService } from './auth.service';
import { APP_GUARD } from '@nestjs/core';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtGuard } from 'src/guards/jwt.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    UsersService,
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
  controllers: [UsersController],
  exports: [UsersService, JwtStrategy],
})
export class UsersModule {}

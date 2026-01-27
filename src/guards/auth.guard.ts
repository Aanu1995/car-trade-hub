import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If route is marked as public, allow access
    if (isPublic) {
      return true;
    }

    // Otherwise, check for authenticated user
    const request = context.switchToHttp().getRequest();
    const { userId } = request?.session ?? {};

    if (!userId) {
      throw new UnauthorizedException();
    }

    try {
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new UnauthorizedException();
      }

      request.currentUser = user;
      request.session.userId = user.id; // Refresh session

      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}

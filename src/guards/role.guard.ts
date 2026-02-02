import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { Roles } from 'src/decorators/role.decorator';
import { User } from 'src/users/user.entity';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const roles = this.reflector.getAllAndOverride<string[]>(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If route is marked as public, allow access
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User | undefined = request.user;

    // If no user is signed in, deny access
    if (!user) {
      return false;
    }

    // If a specific role is required to access this route,
    // check if the user has that role and deny access if not
    if (roles && !roles.includes(user.role)) {
      return false;
    }

    return true;
  }
}

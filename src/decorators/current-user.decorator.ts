import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User, UserWithTokenInfo } from 'src/users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: never, context: ExecutionContext): User => {
    const request = context.switchToHttp().getRequest();

    return request.user;
  },
);

export const UserWithTokenId = createParamDecorator(
  (_data: never, context: ExecutionContext): UserWithTokenInfo => {
    const request = context.switchToHttp().getRequest();

    return request.user;
  },
);

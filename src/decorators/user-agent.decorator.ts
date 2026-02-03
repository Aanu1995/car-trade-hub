import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserAgent = createParamDecorator(
  (_data: never, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest();

    return request.headers['user-agent'];
  },
);

import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/users/user.entity';

export const Roles = Reflector.createDecorator<UserRole[]>();

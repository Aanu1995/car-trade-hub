import { User } from '../entities/user.entity';

export class CreateRefreshTokenDto {
  id: string; // ulid as token ID

  token: string;

  userId: number;

  user: User;

  expiresAt: Date;

  deviceInfo?: string;

  ipAddress?: string;
}

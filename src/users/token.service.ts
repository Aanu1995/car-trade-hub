import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { User } from './entities/user.entity';
import { JwtDto, TokenType } from './dtos/jwt-dto';
import { ulid } from 'ulid';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

export interface TokenPayload {
  userId: number;
  role: string;
}

export interface RefreshTokenPayload {
  userId: number;
  tokenId: string;
}

export interface StoredRefreshToken {
  token: string;
  userId: number;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SessionInfo {
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token';
  private readonly USER_TOKENS_PREFIX = 'user_tokens';

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Generate Redis key for a refresh token
   */
  private getRefreshTokenKey(userId: number, tokenId: string): string {
    return `${this.REFRESH_TOKEN_PREFIX}:${userId}:${tokenId}`;
  }

  /**
   * Generate Redis key for user's token set
   */
  private getUserTokenKey(userId: number): string {
    return `${this.USER_TOKENS_PREFIX}:${userId}`;
  }

  /**
   * Generate access token
   */
  generateAccessToken(user: User): Promise<string> {
    this.logger.log(`Generating access token for user ID: ${user.id}`);
    const payload: TokenPayload = { userId: user.id, role: user.role };

    const options = {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
    } as JwtSignOptions;

    return this.jwtService.signAsync(payload, options);
  }

  /**
   * Generate refresh token and store it in Redis
   */
  async generateRefreshToken(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    this.logger.log(`Generating refresh token for user ID: ${user.id}`);
    const tokenId = ulid();

    const payload: RefreshTokenPayload = { userId: user.id, tokenId };

    const options = {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
    } as JwtSignOptions;

    const refreshToken = await this.jwtService.signAsync(payload, options);
    const decodedRefreshToken = this.jwtService.decode(refreshToken) as {
      exp: number;
    };

    // Hash the token before storing (for security)
    const hashedToken = await this.hashToken(refreshToken);

    // Calculate TTL in seconds
    const ttlSeconds = decodedRefreshToken.exp - Math.floor(Date.now() / 1000);

    // Store refresh token data in Redis
    const tokenData: StoredRefreshToken = {
      token: hashedToken,
      userId: user.id,
      deviceInfo,
      ipAddress,
      createdAt: new Date().toISOString(),
    };

    const refreshTokenKey = this.getRefreshTokenKey(user.id, tokenId);
    const userTokenKey = this.getUserTokenKey(user.id);

    // Use pipeline for atomic operations
    const pipeline = this.redis.pipeline();

    // Store the token with TTL
    pipeline.setex(refreshTokenKey, ttlSeconds, JSON.stringify(tokenData));

    // Add token ID to user's token set (for listing/revoking all)
    pipeline.sadd(userTokenKey, tokenId);

    await pipeline.exec();

    this.logger.log(`Refresh token stored in Redis for user ID: ${user.id}`);

    return refreshToken;
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokenPair(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<JwtDto> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user, deviceInfo, ipAddress),
    ]);

    const decodedAccessToken = this.jwtService.decode(accessToken) as {
      exp: number;
    };
    const decodedRefreshToken = this.jwtService.decode(refreshToken) as {
      exp: number;
    };

    return {
      tokenType: TokenType.BEARER,
      accessToken,
      accessTokenExpiresIn: decodedAccessToken.exp,
      refreshToken,
      refreshTokenExpiresIn: decodedRefreshToken.exp,
    };
  }

  /**
   * Validate and refresh tokens using the refresh token
   * Implements refresh token rotation for security
   */
  async refreshTokens(
    userId: number,
    tokenId: string,
    currentRefreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<JwtDto> {
    const refreshTokenKey = this.getRefreshTokenKey(userId, tokenId);

    // Find the refresh token in Redis
    const storedTokenData = await this.redis.get(refreshTokenKey);

    if (!storedTokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken: StoredRefreshToken = JSON.parse(storedTokenData);

    // Verify the token hash
    const isMatched = await bcrypt.compare(
      currentRefreshToken,
      storedToken.token,
    );

    if (!isMatched) {
      // Potential token theft detected - revoke all tokens for this user
      await this.revokeAllUserTokens(userId);
      throw new UnauthorizedException(
        'Invalid refresh token. All sessions have been revoked for security.',
      );
    }

    // Delete the current refresh token (rotation) - atomic operation
    await this.revokeRefreshToken(tokenId, userId);

    // Get user for generating new tokens
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new token pair
    return this.generateTokenPair(user, deviceInfo, ipAddress);
  }

  /**
   * Revoke a specific refresh token (logout from one device)
   */
  async revokeRefreshToken(tokenId: string, userId: number): Promise<void> {
    const refreshTokenKey = this.getRefreshTokenKey(userId, tokenId);
    const userTokenKey = this.getUserTokenKey(userId);

    const pipeline = this.redis.pipeline();
    pipeline.del(refreshTokenKey);
    pipeline.srem(userTokenKey, tokenId);
    await pipeline.exec();

    this.logger.log(`Refresh token ${tokenId} revoked for user ID: ${userId}`);
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    const userTokenKey = this.getUserTokenKey(userId);

    // Get all token IDs for this user
    const tokenIds = await this.redis.smembers(userTokenKey);

    if (tokenIds.length === 0) {
      return;
    }

    // Delete all tokens in a pipeline
    const pipeline = this.redis.pipeline();

    for (const tokenId of tokenIds) {
      const refreshTokenKey = this.getRefreshTokenKey(userId, tokenId);
      pipeline.del(refreshTokenKey);
    }

    // Clear the user's token set
    pipeline.del(userTokenKey);

    await pipeline.exec();

    this.logger.log(`All refresh tokens revoked for user ID: ${userId}`);
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: number): Promise<SessionInfo[]> {
    const userTokenKey = this.getUserTokenKey(userId);

    // Get all token IDs for this user
    const tokenIds = await this.redis.smembers(userTokenKey);

    if (tokenIds.length === 0) {
      return [];
    }

    // Get all token data
    const pipeline = this.redis.pipeline();
    for (const tokenId of tokenIds) {
      pipeline.get(this.getRefreshTokenKey(userId, tokenId));
    }

    const results = await pipeline.exec();

    const sessions: SessionInfo[] = [];

    if (!results) {
      return sessions;
    }

    for (let i = 0; i < results.length; i++) {
      const [err, data] = results[i];
      if (!err && data) {
        const tokenData: StoredRefreshToken = JSON.parse(data as string);
        sessions.push({
          id: tokenIds[i],
          deviceInfo: tokenData.deviceInfo,
          ipAddress: tokenData.ipAddress,
          createdAt: tokenData.createdAt,
        });
      }
    }

    return sessions;
  }

  /**
   * Hash a token for secure storage
   */
  private hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }
}

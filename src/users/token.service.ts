import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { JwtDto, TokenType } from './dtos/jwt-dto';
import { ulid } from 'ulid';
import * as bcrypt from 'bcrypt';
import { CreateRefreshTokenDto } from './dtos/create-refresh-token.dto';

export interface TokenPayload {
  userId: number;
  role: string;
}

export interface RefreshTokenPayload {
  userId: number;
  tokenId: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate access token
   */
  generateAccessToken(user: User): Promise<string> {
    this.logger.log(`Generating access token for user ID: ${user.id}`);
    const payload: TokenPayload = { userId: user.id, role: user.role };

    const options: JwtSignOptions = {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
    };

    return this.jwtService.signAsync(payload, options);
  }

  /**
   * Generate refresh token and store it in the database
   */
  async generateRefreshToken(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    this.logger.log(`Generating refresh token for user ID: ${user.id}`);
    const tokenId = ulid();

    const payload: RefreshTokenPayload = { userId: user.id, tokenId };

    const options: JwtSignOptions = {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
    };

    const refreshToken = await this.jwtService.signAsync(payload, options);

    // Hash the token before storing (for security)
    const hashedToken = await this.hashToken(refreshToken);

    // Get expiration date from the JWT token
    const { exp } = this.jwtService.decode(refreshToken) as { exp: number };
    const expiresAt = new Date(exp * 1000);

    // Store refresh token in database
    const refreshTokenEntity = this.refreshTokenRepo.create({
      id: tokenId,
      token: hashedToken,
      userId: user.id,
      user,
      expiresAt,
      deviceInfo,
      ipAddress,
    } as CreateRefreshTokenDto);

    await this.refreshTokenRepo.save(refreshTokenEntity);
    this.logger.log(`Refresh token stored for user ID: ${user.id}`);

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
    // Find the refresh token in database
    const storedToken = await this.refreshTokenRepo.findOne({
      where: { id: tokenId, userId: userId },
      relations: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is revoked
    if (storedToken.isRevoked) {
      // Potential token theft detected - revoke all tokens for this user
      await this.revokeAllUserTokens(userId);
      throw new UnauthorizedException(
        'Refresh token has been revoked. Please login again.',
      );
    }

    // Verify the token hash
    const isMatched = await bcrypt.compare(
      currentRefreshToken,
      storedToken.token,
    );

    if (!isMatched) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke the current refresh token (rotation)
    storedToken.isRevoked = true;
    await this.refreshTokenRepo.save(storedToken);

    // Generate new token pair
    return this.generateTokenPair(storedToken.user, deviceInfo, ipAddress);
  }

  /**
   * Revoke a specific refresh token (logout from one device)
   */
  async revokeRefreshToken(tokenId: string, userId: number): Promise<void> {
    await this.refreshTokenRepo.update(
      { id: tokenId, userId },
      { isRevoked: true },
    );
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: number): Promise<RefreshToken[]> {
    return this.refreshTokenRepo.find({
      select: ['id', 'deviceInfo', 'ipAddress', 'createdAt'],
      where: {
        userId,
        isRevoked: false,
        expiresAt: LessThan(new Date()),
      },
    });
  }

  /**
   * Clean up expired tokens (should be run as a cron job)
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  /**
   * Hash a token for secure storage
   */
  private hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }
}

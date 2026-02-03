import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { User, UserWithJwt, UserWithTokenInfo } from './entities/user.entity';
import { JwtDto } from './dtos/jwt-dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async createAccount(email: string, password: string): Promise<User> {
    // check if email is in use
    const existingUser = await this.userService.findOneByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Generate the salt
    const salt = await bcrypt.genSalt();

    // Hash the password and salt together
    const hash = await bcrypt.hash(password, salt);

    // Save the user to the database
    const user = await this.userService.create(email, hash);

    return user;
  }

  async signin(
    email: string,
    password: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<UserWithJwt> {
    // check if email exists in the database
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    // get stored hashed password
    const hashedPassword = user.password;

    // compare the password
    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (!isMatch) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    // Generate token pair (access + refresh)
    const jwt: JwtDto = await this.tokenService.generateTokenPair(
      user,
      deviceInfo,
      ipAddress,
    );

    const signedUser = { ...user, jwt: jwt } as UserWithJwt;

    return signedUser;
  }

  /**
   * Refresh access token using refresh token§
   */
  async refreshTokens(
    userWithTokenId: UserWithTokenInfo,
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<JwtDto> {
    return this.tokenService.refreshTokens(
      userWithTokenId.id,
      userWithTokenId.tokenId,
      refreshToken,
      deviceInfo,
      ipAddress,
    );
  }

  /**
   * Logout user - revoke specific refresh token
   */
  async logout(tokenId: string, userId: number): Promise<void> {
    await this.tokenService.revokeRefreshToken(tokenId, userId);
  }

  /**
   * Logout from all devices - revoke all refresh tokens
   */
  async logoutAllDevices(userId: number): Promise<void> {
    await this.tokenService.revokeAllUserTokens(userId);
  }
}

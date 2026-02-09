import {
  ConflictException,
  Injectable,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { User, UserWithJwt, UserWithTokenInfo } from './entities/user.entity';
import { JwtDto } from './dtos/jwt-dto';
import { TokenService } from './token.service';
import { Profile as GoogleProfile } from 'passport-google-oauth20';
import { Profile as GithubProfile } from 'passport-github2';
import { AuthProvider } from './entities/user-identity.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async createAccount(email: string, password: string): Promise<User> {
    const maskedEmail = this.maskEmail(email);
    this.logger.log(`Attempting to create account for ${maskedEmail}`);

    // If a user with the email already exists,
    let existingUser = await this.userService.findOneByEmail(email, {
      withIdentities: true,
    });

    if (existingUser) {
      // If the existing user does not have identities this is an unexpected state
      if (!existingUser.identities || existingUser.identities.length === 0) {
        throw new InternalServerErrorException('User identities not available');
      }

      // Check if the existing user has a local identity (i.e., password-based login)
      const localIdentity = existingUser.identities.find((identity) => {
        return identity.provider === AuthProvider.LOCAL;
      });

      // If a local identity already exists, then another account with the same email
      if (localIdentity) {
        this.logger.error(
          `Account creation failed - email already in use: ${maskedEmail}`,
        );
        throw new ConflictException('Email already in use');
      }

      // Allow password setup for users created via social sign-in
      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(password, salt);

      existingUser = await this.userService.update(existingUser.id, {
        password: hash,
      });
    } else {
      // No user exists with this email, create a new user record
      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(password, salt);

      // Save the user to the database
      existingUser = await this.userService.create(email, hash);
    }

    // Create a local identity for the user if it doesn't exist
    await this.userService.createIdentity({
      userId: existingUser.id,
      provider: AuthProvider.LOCAL,
      providerUserId: existingUser.id.toString(),
      email: existingUser.email,
      emailVerified: true,
    });

    this.logger.log(
      `Account created successfully for user ID: ${existingUser.id}`,
    );
    return existingUser;
  }

  async signin(
    email: string,
    password: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<UserWithJwt> {
    const maskedEmail = this.maskEmail(email);
    this.logger.log(
      `Sign-in attempt for ${maskedEmail} from IP: ${ipAddress || 'unknown'}`,
    );

    // check if email exists in the database
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      this.logger.error(`Sign-in failed - user not found: ${maskedEmail}`);
      throw new UnauthorizedException('Incorrect email or password');
    }

    // get stored hashed password
    const hashedPassword = user.password;

    if (!hashedPassword) {
      this.logger.error(
        `Sign-in failed - password login not enabled for user ID: ${user.id}`,
      );
      throw new UnauthorizedException('Incorrect email or password');
    }

    // compare the password
    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (!isMatch) {
      this.logger.error(
        `Sign-in failed - invalid password for user ID: ${user.id}`,
      );
      throw new UnauthorizedException('Incorrect email or password');
    }

    const signedUser = await this.issueJwtForUser(user, deviceInfo, ipAddress);

    this.logger.log(`Sign-in successful for user ID: ${user.id}`);
    return signedUser;
  }

  async signinWithGoogle(
    profile: GoogleProfile,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<UserWithJwt> {
    const googleId = profile.id;

    // Find the verified email from the profile
    const verifiedEmailEntry = profile.emails?.find((email) => {
      return email.value && email.verified;
    });

    if (!verifiedEmailEntry?.value) {
      this.logger.error(`Google sign-in failed - no verified email in profile`);
      throw new UnauthorizedException('Google account has no verified email');
    }

    const email = verifiedEmailEntry.value.toLowerCase();
    const maskedEmail = this.maskEmail(email);

    this.logger.log(
      `Google sign-in attempt for ${maskedEmail} from IP: ${ipAddress || 'unknown'}`,
    );

    // Check if there's an existing identity for this Google ID
    const existingIdentity =
      await this.userService.findIdentityByProviderUserId(
        AuthProvider.GOOGLE,
        googleId,
      );

    let user: User | null = null;

    if (existingIdentity) {
      user = await this.userService.findOne(existingIdentity.userId);
    } else {
      // No existing identity - check if there's a user with the same email
      user = await this.userService.findOneByEmail(email);

      // If no user exists with this email, create a new user record
      if (!user) {
        user = await this.userService.createOAuthUser(email);
      }

      await this.userService.createIdentity({
        userId: user.id,
        provider: AuthProvider.GOOGLE,
        providerUserId: googleId,
        email,
        emailVerified: true,
      });
    }

    if (!user) {
      this.logger.error(
        `Google sign-in failed - user not found for Google ID: ${googleId}`,
      );
      throw new UnauthorizedException('User not found');
    }

    const signedUser = await this.issueJwtForUser(user, deviceInfo, ipAddress);

    this.logger.log(`Google sign-in successful for user ID: ${user.id}`);
    return signedUser;
  }

  async signinWithGithub(
    profile: GithubProfile,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<UserWithJwt> {
    const githubId = profile.id;

    const emailEntry = profile.emails?.find((email) => email.value);

    if (!emailEntry?.value) {
      this.logger.error('GitHub sign-in failed - no email in profile');
      throw new UnauthorizedException('GitHub account has no email');
    }

    const email = emailEntry.value.toLowerCase();
    const maskedEmail = this.maskEmail(email);

    this.logger.log(
      `GitHub sign-in attempt for ${maskedEmail} from IP: ${ipAddress || 'unknown'}`,
    );

    const existingIdentity =
      await this.userService.findIdentityByProviderUserId(
        AuthProvider.GITHUB,
        githubId,
      );

    let user: User | null = null;

    if (existingIdentity) {
      user = await this.userService.findOne(existingIdentity.userId);
    } else {
      user = await this.userService.findOneByEmail(email);

      if (!user) {
        user = await this.userService.createOAuthUser(email);
      }

      await this.userService.createIdentity({
        userId: user.id,
        provider: AuthProvider.GITHUB,
        providerUserId: githubId,
        email,
        emailVerified: true,
      });
    }

    if (!user) {
      this.logger.error(
        `GitHub sign-in failed - user not found for GitHub ID: ${githubId}`,
      );
      throw new UnauthorizedException('User not found');
    }

    const signedUser = await this.issueJwtForUser(user, deviceInfo, ipAddress);

    this.logger.log(`GitHub sign-in successful for user ID: ${user.id}`);
    return signedUser;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(
    userWithTokenId: UserWithTokenInfo,
    refreshToken: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<JwtDto> {
    this.logger.log(
      `Token refresh requested for user ID: ${userWithTokenId.id}`,
    );
    const result = await this.tokenService.refreshTokens(
      userWithTokenId.id,
      userWithTokenId.tokenId,
      refreshToken,
      deviceInfo,
      ipAddress,
    );

    this.logger.log(
      `Token refresh successful for user ID: ${userWithTokenId.id}`,
    );
    return result;
  }

  /**
   * Logout user - revoke specific refresh token
   */
  async logout(tokenId: string, userId: number): Promise<void> {
    this.logger.log(`Logout requested for user ID: ${userId}`);

    await this.tokenService.revokeRefreshToken(tokenId, userId);

    this.logger.log(`Logout successful for user ID: ${userId}`);
  }

  /**
   * Logout from all devices - revoke all refresh tokens
   */
  async logoutAllDevices(userId: number): Promise<void> {
    this.logger.log(`Logout from all devices requested for user ID: ${userId}`);

    await this.tokenService.revokeAllUserTokens(userId);

    this.logger.log(
      `Logout from all devices successful for user ID: ${userId}`,
    );
  }

  /**
   * Masks email for logging purposes (e.g., "user@example.com" -> "us***@example.com")
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? local.slice(0, 2) + '***' : '***';
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Issues JWT tokens for a user
   */
  private async issueJwtForUser(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<UserWithJwt> {
    const jwt: JwtDto = await this.tokenService.generateTokenPair(
      user,
      deviceInfo,
      ipAddress,
    );

    return { ...user, jwt } as UserWithJwt;
  }
}

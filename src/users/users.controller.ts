import {
  Body,
  Controller,
  Get,
  Patch,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Ip,
  Header,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';
import { Timeout } from 'src/interceptors/timeout.interceptor';
import { AuthService } from './auth.service';
import {
  CurrentUser,
  OAuthProfile,
  UserWithTokenId,
} from 'src/decorators/current-user.decorator';
import { User, UserWithJwt, UserWithTokenInfo } from './entities/user.entity';
import { Public } from 'src/decorators/public.decorator';
import { JwtDto, UserDtoWithJwtDto } from './dtos/jwt-dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { JwtRefreshGuard } from 'src/guards/jwt-refresh.guard';
import { UserAgent } from 'src/decorators/user-agent.decorator';
import type { Profile as GoogleProfile } from 'passport-google-oauth20';
import type { Profile as GithubProfile } from 'passport-github2';
import type { Profile as AppleProfile } from 'passport-apple';
import { GoogleAuthGuard } from 'src/guards/google-auth.guard';
import { GithubAuthGuard } from 'src/guards/github-auth.guard';
import { AppleAuthGuard } from 'src/guards/apple-auth.guard';
import { authLoginPageHtml } from './views/auth-login-page';
import { renderAuthHomePage } from './views/auth-home-page';
import { AuthProvider } from './entities/user-identity.entity';

@Controller('auth')
@Timeout()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Header('Content-Type', 'text/html')
  @Get('')
  authentication(): string {
    return authLoginPageHtml;
  }

  @Public()
  @Serialize(UserDto)
  @Post('signup')
  async createUser(@Body() body: CreateUserDto): Promise<User> {
    return await this.authService.createAccount(body.email, body.password);
  }

  @Public()
  @Serialize(UserDtoWithJwtDto)
  @Post('signin')
  signin(
    @Body() body: CreateUserDto,
    @UserAgent() deviceInfo: string,
    @Ip() ipAddress: string,
  ): Promise<UserWithJwt> {
    return this.authService.signinWithEmailAndPassword(
      body.email,
      body.password,
      deviceInfo,
      ipAddress,
    );
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth(): void {
    return;
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Header('Content-Type', 'text/html')
  @Get('google/callback')
  async googleAuthCallback(
    @OAuthProfile() profile: GoogleProfile,
    @UserAgent() deviceInfo: string,
    @Ip() ipAddress: string,
  ): Promise<string> {
    const signedUser = await this.authService.signinWithGoogle(
      profile,
      deviceInfo,
      ipAddress,
    );
    const { password, role, ...safeUser } = signedUser;
    return renderAuthHomePage(safeUser, AuthProvider.GOOGLE);
  }

  @Public()
  @UseGuards(GithubAuthGuard)
  @Get('github')
  githubAuth(): void {
    return;
  }

  @Public()
  @UseGuards(GithubAuthGuard)
  @Header('Content-Type', 'text/html')
  @Get('github/callback')
  async githubAuthCallback(
    @OAuthProfile() profile: GithubProfile,
    @UserAgent() deviceInfo: string,
    @Ip() ipAddress: string,
  ): Promise<string> {
    const signedUser = await this.authService.signinWithGithub(
      profile,
      deviceInfo,
      ipAddress,
    );
    const { password, role, ...safeUser } = signedUser;
    return renderAuthHomePage(safeUser, AuthProvider.GITHUB);
  }

  @Public()
  @UseGuards(AppleAuthGuard)
  @Get('apple')
  appleAuth(): void {
    return;
  }

  @Public()
  @UseGuards(AppleAuthGuard)
  @Header('Content-Type', 'text/html')
  @Get('apple/callback')
  async appleAuthCallback(
    @OAuthProfile() profile: AppleProfile,
    @UserAgent() deviceInfo: string,
    @Ip() ipAddress: string,
  ): Promise<string> {
    const signedUser = await this.authService.signinWithApple(
      profile,
      deviceInfo,
      ipAddress,
    );
    const { password, role, ...safeUser } = signedUser;
    return renderAuthHomePage(safeUser, AuthProvider.APPLE);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refreshTokens(
    @UserWithTokenId() user: UserWithTokenInfo,
    @UserAgent() deviceInfo: string,
    @Body() body: RefreshTokenDto,
    @Ip() ipAddress: string,
  ): Promise<JwtDto> {
    return this.authService.refreshTokens(
      user,
      body.refreshToken,
      deviceInfo,
      ipAddress,
    );
  }

  @Serialize(UserDto)
  @Get('me')
  async currentUser(@CurrentUser() currentUser: User): Promise<User> {
    const user = await this.usersService.findOne(currentUser.id);

    if (!user) {
      throw new NotFoundException(`User with id ${currentUser.id} not found`);
    }

    return user;
  }

  @Serialize(UserDto)
  @Get()
  async findAllUsers(@Query('email') email: string): Promise<User[]> {
    return await this.usersService.find(email);
  }

  @Serialize(UserDto)
  @Get(':id')
  async findUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  @Serialize(UserDto)
  @Patch(':id')
  async UpdateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ): Promise<UserDto> {
    return await this.usersService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async DeleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.remove(id);
  }

  @Delete('signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signout(@CurrentUser() currentUser: User): Promise<void> {
    // Note: For proper logout, we need the tokenId from the refresh token
    // This endpoint logs out from all devices for simplicity
    // For single device logout, the client should call /signout with the refresh token
    await this.authService.logoutAllDevices(currentUser.id);
  }

  @Delete('signout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async signoutAllDevices(@CurrentUser() currentUser: User): Promise<void> {
    await this.authService.logoutAllDevices(currentUser.id);
  }
}

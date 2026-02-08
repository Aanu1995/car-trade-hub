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
import type { Profile } from 'passport-google-oauth20';
import { GoogleAuthGuard } from 'src/guards/google-auth.guard';
import { authLoginPageHtml } from './views/auth-login-page';
import { renderAuthHomePage } from './views/auth-home-page';

@Controller('auth')
@Timeout()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}
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
    return this.authService.signin(
      body.email,
      body.password,
      deviceInfo,
      ipAddress,
    );
  }

  @Public()
  @Header('Content-Type', 'text/html')
  @Get('')
  authentication(): string {
    return authLoginPageHtml;
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
    @OAuthProfile() profile: Profile,
    @UserAgent() deviceInfo: string,
    @Ip() ipAddress: string,
  ): Promise<string> {
    const signedUser = await this.authService.signinWithGoogle(
      profile,
      deviceInfo,
      ipAddress,
    );
    const { password, role, ...safeUser } = signedUser;
    return renderAuthHomePage(safeUser);
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
  @Get(':id')
  async findUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  @Serialize(UserDto)
  @Get()
  async findAllUsers(@Query('email') email: string): Promise<User[]> {
    return await this.usersService.find(email);
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
}

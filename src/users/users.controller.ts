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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';
import { Timeout } from 'src/interceptors/timeout.interceptor';
import { AuthService } from './auth.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User, UserWithJwt } from './user.entity';
import { Public } from 'src/decorators/public.decorator';
import { UserDtoWithJwtDto } from './dtos/jwt-dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
@Timeout()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}
  @Public()
  @Serialize(UserDto)
  @Post('/signup')
  async createUser(@Body() body: CreateUserDto): Promise<User> {
    try {
      const user = await this.authService.createAccount(
        body.email,
        body.password,
      );

      return user;
    } catch (error) {
      throw error;
    }
  }

  @Public()
  @Serialize(UserDtoWithJwtDto)
  @Post('/signin')
  signin(@Body() body: CreateUserDto): Promise<UserWithJwt> {
    try {
      return this.authService.signin(body.email, body.password);
    } catch (error) {
      throw error;
    }
  }

  @Serialize(UserDto)
  @Delete('/signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  signout(): void {}

  @Serialize(UserDto)
  @Get('/me')
  async currentUser(@CurrentUser() currentUser: User): Promise<User> {
    try {
      const user = await this.usersService.findOne(currentUser.id);

      if (!user) {
        throw new NotFoundException(`User with id ${currentUser.id} not found`);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  @Serialize(UserDto)
  @Get(':id')
  async findUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    try {
      const user = await this.usersService.findOne(id);

      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      return user;
    } catch (error) {
      throw error;
    }
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
    try {
      return await this.usersService.update(id, body);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async DeleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      await this.usersService.remove(id);
    } catch (error) {
      throw error;
    }
  }
}

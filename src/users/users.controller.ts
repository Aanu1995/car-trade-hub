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
  Session,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';
import { Timeout } from 'src/interceptors/timeout.interceptor';
import { AuthService } from './auth.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from './user.entity';
import { Public } from 'src/decorators/public.decorator';

@Controller('auth')
@Timeout()
@Serialize(UserDto)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}
  @Public()
  @Post('/signup')
  async createUser(@Body() body: CreateUserDto): Promise<UserDto> {
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
  @Post('/signin')
  async signin(
    @Body() body: CreateUserDto,
    @Session() session: any,
  ): Promise<UserDto> {
    try {
      const user = await this.authService.signin(body.email, body.password);

      // store user id in session
      session.userId = user.id;

      return user;
    } catch (error) {
      throw error;
    }
  }

  @Delete('/signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  signout(@Session() session: any): void {
    // clear user id from session
    session.userId = null;
  }

  @Get('/me')
  async currentUser(@CurrentUser() currentUser: User): Promise<UserDto> {
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

  @Get(':id')
  async findUser(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
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

  @Get()
  async findAllUsers(@Query('email') email: string): Promise<UserDto[]> {
    return await this.usersService.find(email);
  }

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
  async DeleteUser(@Param('id', ParseIntPipe) id: number): Promise<UserDto> {
    try {
      return await this.usersService.remove(id);
    } catch (error) {
      throw error;
    }
  }
}

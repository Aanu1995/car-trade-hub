import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dtos/update-user.dto';
import { CreateUserDto } from './dtos/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;

  const fakeUsersService: Partial<UsersService> = {
    findOne: (id: number) => {
      return Promise.resolve({ id, email: 'olakunleaanu@gmail.com' } as User);
    },
    find: (email: string) => {
      return Promise.resolve([{ id: 1, email } as User]);
    },
    update: (id: number, attrs: Partial<User>) => {
      return Promise.resolve({ id, ...attrs } as User);
    },
    remove: (id: number) => {
      return Promise.resolve({ id, email: 'olakunleaanu@gmail.com' } as User);
    },
  };

  const fakeAuthService: Partial<AuthService> = {
    createAccount: (email: string, password: string) => {
      return Promise.resolve({ id: 1, email, password } as User);
    },
    signin: (email: string, password: string) => {
      return Promise.resolve({ id: 1, email, password } as User);
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: fakeUsersService },
        { provide: AuthService, useValue: fakeAuthService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return user with the given id', async () => {
    const user = await controller.findUser(1);
    expect(user.email).toBeDefined();
  });

  it('should thrown error if user with given id is not found', async () => {
    fakeUsersService.findOne = (id: number) => Promise.resolve(null);
    await expect(controller.findUser(1)).rejects.toThrow(NotFoundException);
  });

  it('should return user with the given id updated', async () => {
    const updatedUserDto = {
      email: 'newemail@example.com',
    } as UpdateUserDto;

    const user = await controller.UpdateUser(1, updatedUserDto);
    expect(user.email).toBeDefined();
    expect(user.email).toEqual(updatedUserDto.email);
  });

  it('should return the deleted user', async () => {
    const user = await controller.DeleteUser(1);
    expect(user).toBeDefined();
  });

  it('should return user when signed in with correct credentials', async () => {
    const session = {} as any;
    const createUserDto = {
      email: 'olakunleaanu@gmail.com',
      password: 'password',
    } as CreateUserDto;

    const user = await controller.signin(createUserDto, session);

    expect(user).toBeDefined();
    expect(user.email).toEqual(createUserDto.email);
    expect(session.userId).toEqual(user.id);
  });

  it('should return user when account is created', async () => {
    const session = {} as any;
    const createUserDto = {
      email: 'olakunleaanu@gmail.com',
      password: 'password',
    } as CreateUserDto;

    const user = await controller.createUser(createUserDto);

    expect(user).toBeDefined();
    expect(user.email).toEqual(createUserDto.email);
  });

  it('should signed user out', async () => {
    const session = {} as any;

    controller.signout(session);

    expect(session.userId).toBeNull();
  });
});

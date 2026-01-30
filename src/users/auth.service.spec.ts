import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  const password = 'mypassword';

  const fakeUsersService: Partial<UsersService> = {
    findOneByEmail: (email: string) => Promise.resolve(null),
    create: (email: string, password: string) => {
      const user = { id: 1, email, password } as User;
      return Promise.resolve(user);
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  // Create account tests
  describe('create Account', () => {
    it('should create an account', async () => {
      const user = await authService.createAccount(
        'example@gmail.com',
        password,
      );

      expect(user.password).not.toEqual(password);
      expect(user.email).toEqual('example@gmail.com');

      const [salt, hash] = user.password.split('.');

      expect(salt).toBeDefined();
      expect(hash).toBeDefined();
    });

    it('should throw an error if user already exists', async () => {
      fakeUsersService.findOneByEmail = (email: string) => {
        const user = { id: 1, email: email } as User;
        return Promise.resolve(user);
      };

      await expect(
        authService.createAccount('example@gmail.com', password),
      ).rejects.toThrow(ConflictException);
    });
  });

  // Sign in tests
  describe('sign in', () => {
    it('should sign in', async () => {
      fakeUsersService.findOneByEmail = (email: string) => {
        const user = {
          id: 1,
          email: email,
          password: `34fbbb6f828bdfcc.7f997f96a5922d56f87b788dc3c5b85ce7d18765bf06f0fcbcff82c98efdf634`,
        } as User;
        return Promise.resolve(user);
      };

      const user = await authService.signin('example@gmail.com', password);
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
    });

    it('should throw an error if email is invalid', async () => {
      fakeUsersService.findOneByEmail = (email: string) => {
        return Promise.resolve(null);
      };

      await expect(
        authService.signin('aanu@gmail.com', password),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an error if password is invalid', async () => {
      fakeUsersService.findOneByEmail = (email: string) => {
        const user = {
          id: 1,
          email: email,
          password: `34fbbb6f828bdfcc.7f997f96a5922d56f87b788dc3c5b85ce7d18765bf06f0fcbcff82c98efdf634`,
        } as User;
        return Promise.resolve(user);
      };

      await expect(
        authService.signin('example@gmail.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

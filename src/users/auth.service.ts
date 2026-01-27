import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { promisify } from 'util';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { User } from './user.entity';

const scrypt = promisify(_scrypt);

enum HashEncoding {
  HEX = 'hex',
  BASE64 = 'base64',
  UTF8 = 'utf8',
}

@Injectable()
export class AuthService {
  private readonly encoding = HashEncoding.HEX;

  constructor(private readonly userService: UsersService) {}

  async createAccount(email: string, password: string): Promise<User> {
    // check if email is in use
    const existingUser = await this.userService.findOneByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Generate the salt
    const salt = randomBytes(8).toString(this.encoding);

    // Hash the password and salt together
    const hash = await this.hashPassword(password, salt);

    // Join the hashed password and salt together
    const result = salt + '.' + hash;

    // Save the user to the database
    const user = await this.userService.create(email, result);

    return user;
  }

  async signin(email: string, password: string): Promise<User> {
    // check if email exists in the database
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    const [salt, storedHash] = user.password.split('.');

    const hash = await this.hashPassword(password, salt);

    if (hash !== storedHash) {
      throw new UnauthorizedException('Incorrect email or password');
    }

    return user;
  }

  private async hashPassword(
    password: string,
    salt: string,
    keylen: number = 32,
    encoding: HashEncoding = this.encoding,
  ): Promise<string> {
    const hash = (await scrypt(password, salt, keylen)) as Buffer;
    return hash.toString(encoding);
  }
}

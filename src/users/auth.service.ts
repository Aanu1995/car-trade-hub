import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserWithJwt } from './user.entity';
import { JwtDto, TokenType } from './dtos/jwt-dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
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

  async signin(email: string, password: string): Promise<UserWithJwt> {
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

    const payload = { userId: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    const jwt: JwtDto = {
      tokenType: TokenType.BEARER,
      accessToken: accessToken,
      accessTokenExpiresIn: this.jwtService.decode(accessToken)['exp'],
      refreshToken: accessToken,
      refreshTokenExpiresIn: this.jwtService.decode(accessToken)['exp'],
    };

    const signedUser = { ...user, jwt: jwt } as UserWithJwt;

    return signedUser;
  }
}

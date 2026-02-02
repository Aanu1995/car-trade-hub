import { Expose, Type } from 'class-transformer';
import { UserDto } from './user.dto';

export class JwtDto {
  @Expose({})
  tokenType: string;

  @Expose()
  accessToken: string;

  @Expose()
  accessTokenExpiresIn: number;

  @Expose()
  refreshToken: string;

  @Expose()
  refreshTokenExpiresIn: number;
}

export class UserDtoWithJwtDto extends UserDto {
  @Expose()
  @Type(() => JwtDto)
  jwt: JwtDto;
}

export enum TokenType {
  BEARER = 'Bearer',
}

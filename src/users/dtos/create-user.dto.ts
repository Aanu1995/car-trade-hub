import { IsEmail, IsString, IsStrongPassword, Matches } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minSymbols: 0,
    minNumbers: 1,
    minUppercase: 1,
    minLowercase: 1,
  })
  password: string;
}

import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReportDto {
  @IsNumber()
  @IsPositive()
  @Max(100000000)
  price: number;

  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsNumber()
  @Min(new Date().getFullYear() - 50)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsNumber()
  @IsLatitude()
  latitude: number;

  @IsNumber()
  @IsLongitude()
  longitude: number;

  @IsNumber()
  @IsPositive()
  mileage: number;
}

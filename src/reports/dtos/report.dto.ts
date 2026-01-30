import { Expose, Transform, Type } from 'class-transformer';
import { UserDto } from 'src/users/dtos/user.dto';

export class ReportDto {
  @Expose()
  id: number;

  @Expose()
  price: number;

  @Expose()
  make: string;

  @Expose()
  model: string;

  @Expose()
  year: number;

  @Expose()
  latitude: number;

  @Expose()
  longitude: number;

  @Expose()
  mileage: number;

  @Expose()
  approved: boolean;

  @Expose()
  @Transform(({ obj }) => obj.createdBy?.id)
  userId: number;

  // @Expose()
  // @Type(() => UserDto)
  // createdBy: UserDto;

  @Expose()
  createdOn: Date;

  @Expose()
  updatedOn: Date;
}

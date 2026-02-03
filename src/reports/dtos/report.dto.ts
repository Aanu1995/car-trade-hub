import { Expose } from 'class-transformer';

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
  createdById: number;

  // @Expose()
  // @Type(() => UserDto)
  // createdBy: UserDto;

  @Expose()
  createdOn: Date;

  @Expose()
  updatedOn: Date;
}

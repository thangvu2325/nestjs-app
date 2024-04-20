import { Expose, Transform } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';
import { DevicesDto } from 'src/devices/dto/devices.dto';
import { UsersDto } from 'src/users/users.dto';

export class CustomersDto extends BaseDto {
  @Transform(({ obj }) => obj.firstName + ' ' + obj.lastName)
  @Expose()
  fullName: string;
  @Expose()
  customer_id: string;
  @Expose()
  email: string;
  @Expose()
  phone: string;
  @Expose()
  devices: DevicesDto[];
  @Expose()
  user: UsersDto;
}

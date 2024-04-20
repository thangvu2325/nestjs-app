import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';
import { CustomersDto } from 'src/customers/customers.dto';

export class UsersDto extends BaseDto {
  @Expose()
  username: string;
  password: string;
  @Expose()
  avatar: string;
  @Expose()
  email: string;
  @Expose()
  phone: string;
  @Expose()
  isActive: boolean;
  @Expose()
  role: string;
  @Expose()
  customer: CustomersDto;
}

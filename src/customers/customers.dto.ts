import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';
import { UsersDto } from 'src/users/users.dto';

export class CustomersDto extends BaseDto {
  @Expose()
  first_name: string;
  @Expose()
  last_name: string;
  @Expose()
  customer_id: string;
  @Expose()
  email: string;
  @Expose()
  phone: string;
  @Expose()
  user: UsersDto;
}

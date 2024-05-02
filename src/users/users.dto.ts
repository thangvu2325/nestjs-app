import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class UsersDto extends BaseDto {
  first_name: string;
  last_name: string;
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
  customer_id: string;
}

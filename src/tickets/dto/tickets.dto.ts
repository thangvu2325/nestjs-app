import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';
import { UsersDto } from 'src/users/users.dto';

export class TicketDto extends BaseDto {
  @Expose()
  topic: string;
  @Expose()
  priority: string;
  @Expose()
  customer_Id: string;
  @Expose()
  submiter: Array<string>;
  @Expose()
  notes: string;
  @Expose()
  rate: number;
  @Expose()
  category: string;
  @Expose()
  message: string;
  @Expose()
  status: string;
  @Expose()
  assignee: UsersDto[];
}

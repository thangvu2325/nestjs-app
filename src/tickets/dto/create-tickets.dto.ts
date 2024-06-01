import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class CreateTicketDto extends BaseDto {
  @Expose()
  topic: string;
  @Expose()
  priority: string;
  @Expose()
  notes: string;
  @Expose()
  rate: number;
  @Expose()
  category: string;
  @Expose()
  status: string;
}

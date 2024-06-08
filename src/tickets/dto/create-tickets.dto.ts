import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class CreateTicketDto extends BaseDto {
  @ApiProperty()
  userId: string;
  @ApiProperty()
  @Expose()
  topic: string;
  @Expose()
  priority: string;
  @ApiProperty()
  @Expose()
  notes: string;
  @Expose()
  rate: number;
  @Expose()
  category: string;
  @Expose()
  status: string;
}

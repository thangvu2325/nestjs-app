import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class SimDto extends BaseDto {
  @Expose()
  imsi: string;
}

import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class BatteryDto extends BaseDto {
  @Expose()
  voltage: number;
  @Expose()
  source: string;
}

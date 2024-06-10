import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class SensorsDto extends BaseDto {
  @Expose()
  AlarmSatus: boolean;
  @Expose()
  blackSmokeVal: number;
  @Expose()
  whiteSmokeVal: number;
  @Expose()
  Temperature: number;
  @Expose()
  Humidity: number;
}

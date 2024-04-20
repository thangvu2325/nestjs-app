import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class SensorsDto extends BaseDto {
  @Expose()
  sensorId: string;
  @Expose()
  smokeValue: number;
}

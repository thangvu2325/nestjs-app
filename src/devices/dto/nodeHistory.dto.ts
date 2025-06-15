import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';
import { SensorsDto } from './sensors.dto';
import { BatteryDto } from './battery.dto';
import { NodesDto } from './nodes.dto';
export class NodeHistoryDto extends BaseDto {
  @Expose()
  node: NodesDto;
  @Expose()
  sensors: SensorsDto;
  @Expose()
  battery: BatteryDto;
}

import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';
import { SensorsDto } from './sensors.dto';
import { BatteryDto } from './battery.dto';
import { SignalDto } from './signal.dto';
import { SimDto } from './sim.dto';
import { DevicesDto } from './devices.dto';
export class HistoryDto extends BaseDto {
  @Expose()
  device: DevicesDto;
  @Expose()
  sensors: SensorsDto;
  @Expose()
  battery: BatteryDto;
  @Expose()
  signal: SignalDto;
  @Expose()
  sim: SimDto;
  @Expose()
  logger: string;
}

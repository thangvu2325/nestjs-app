import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';
import { SensorsDto } from './sensors.dto';
import { BatteryDto } from './battery.dto';
import { SignalDto } from './signal.dto';
import { SimDto } from './sim.dto';
import { CustomersDto } from 'src/customers/customers.dto';

export class DevicesDto extends BaseDto {
  @Expose()
  customer: CustomersDto;
  @Expose()
  deviceId: string;
  @Expose()
  rssi: number;
  @Expose()
  sensors: SensorsDto;
  @Expose()
  battery: BatteryDto;
  @Expose()
  signal: SignalDto;
  @Expose()
  sim: SimDto;
}

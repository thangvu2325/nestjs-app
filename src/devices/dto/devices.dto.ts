import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';
import { SensorsDto } from './sensors.dto';
import { BatteryDto } from './battery.dto';
import { SignalDto } from './signal.dto';
import { SimDto } from './sim.dto';
import { ApiProperty } from '@nestjs/swagger';

export class DevicesDto extends BaseDto {
  @ApiProperty()
  @Expose()
  deviceId: string;
  @Expose()
  deviceName: string;
  type: string;
  @ApiProperty()
  @Expose()
  secretKey: string;
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
  @Expose()
  active: string;
  @Expose()
  AlarmReport: number;
  @Expose()
  roomId: string;
  @Expose()
  ownerId: string;
  @Expose()
  role: 'owner' | 'member';
}

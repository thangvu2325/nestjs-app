import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';
import { SensorsDto } from './sensors.dto';
import { BatteryDto } from './battery.dto';
import { ApiProperty } from '@nestjs/swagger';

export class NodesDto extends BaseDto {
  @ApiProperty()
  @Expose()
  nodeId: string;
  @Expose()
  nodeName: string;
  @Expose()
  sensors: SensorsDto;
  @Expose()
  battery: BatteryDto;
  @Expose()
  AlarmReport: number;
  @Expose()
  roomId: string;
  @Expose()
  roomHistoryLoggerId: string;
  @Expose()
  deviceId: string;
}

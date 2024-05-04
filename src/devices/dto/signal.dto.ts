import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class SignalDto extends BaseDto {
  @Expose()
  Operator: string;
  @Expose()
  band: number;
  @Expose()
  EARFCN: number;
  @Expose()
  PCI: number;
  @Expose()
  connectionStatus: number;
  @Expose()
  ipAddress: string;
  @Expose()
  RSRP: number;
  @Expose()
  RSSI: number;
  @Expose()
  RSRQ: number;
  @Expose()
  T3324: number;
  @Expose()
  T3412: number;
  @Expose()
  tac: string;
}

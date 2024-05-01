import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class SignalDto extends BaseDto {
  @Expose()
  Operator: string;
  @Expose()
  band: string;
  @Expose()
  EARFCN: string;
  @Expose()
  PCI: string;
  @Expose()
  connectionStatus: string;
  @Expose()
  ipAddress: string;
  @Expose()
  RSRP: string;
  @Expose()
  RSSI: string;
  @Expose()
  RSRQ: string;
  @Expose()
  T3324: string;
  @Expose()
  T3412: string;
  @Expose()
  tac: string;
}

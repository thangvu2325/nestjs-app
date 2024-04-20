import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';
import { NetWorkDto } from './network.dto';

export class SignalDto extends BaseDto {
  @Expose()
  band: string;
  @Expose()
  deviceNetworkRssiDbm: number;
  @Expose()
  gsmStatus: string;
  @Expose()
  networkReport: NetWorkDto;
}

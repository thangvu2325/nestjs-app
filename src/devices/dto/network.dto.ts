import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class NetWorkDto extends BaseDto {
  @Expose()
  absoluteRadioFrequencyChannel: string;
  @Expose()
  areaTacChangeCount: string;
  @Expose()
  cellChangeCount: string;
  @Expose()
  cellId: string;
  @Expose()
  connectionStatus: string;
  @Expose()
  extendedDiscontinuousReception: string;
  @Expose()
  ipAddress: string;
  @Expose()
  mcc: string;
  @Expose()
  mnc: string;
  @Expose()
  referenceSignalReceivedPower: string;
  @Expose()
  referenceSignalReceivedQuality: string;
  @Expose()
  requestedActiveTime: string;
  @Expose()
  requestedPeriodicTrackingAreaUpdate: string;
  @Expose()
  tac: string;
  @Expose()
  timestamp: Date;
}

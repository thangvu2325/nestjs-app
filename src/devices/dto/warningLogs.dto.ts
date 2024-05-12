import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class WarningLogsDto extends BaseDto {
  @Expose()
  message: string;
}

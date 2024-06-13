import { Expose } from 'class-transformer';
import { BaseDto } from 'src/common/base.dto';

export class HistoryLoggerDto extends BaseDto {
  @Expose()
  logger: string;
}

import { BaseDto } from 'src/common/base.dto';

export class NotificationDto extends BaseDto {
  notification_token: string;

  device_type: string;
}

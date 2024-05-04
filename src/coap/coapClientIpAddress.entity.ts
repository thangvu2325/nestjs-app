import { BaseEntity } from 'src/common/mysql/base.entity';
import { Entity, Column } from 'typeorm';

@Entity({
  name: 'coapClientIpAddress',
})
export class CoapClientIpAddressEntity extends BaseEntity {
  @Column({ default: '' })
  ip: string;
  @Column({ default: '' })
  deviceId: string;
}

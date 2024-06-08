import { Entity, Column } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';

@Entity({
  name: 'keyadddevices',
})
export class KeyAddDeviceEntity extends BaseEntity {
  @Column({ default: '' })
  key: string;
  @Column({ default: '' })
  deviceId: string;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  activeKeyExpiresAt: Date;
}

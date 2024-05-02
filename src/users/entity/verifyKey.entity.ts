import { BaseEntity } from 'src/common/mysql/base.entity';
import { Entity, Column } from 'typeorm';

@Entity({
  name: 'verifyKey',
})
export class VerifyEntity extends BaseEntity {
  @Column({
    default: 0,
  })
  secretKey: number;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  activeKeyExpiresAt: Date;
}

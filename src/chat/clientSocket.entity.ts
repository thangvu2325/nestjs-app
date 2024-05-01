import { BaseEntity } from 'src/common/mysql/base.entity';
import { Entity, Column } from 'typeorm';

@Entity({
  name: 'clientSocket',
})
export class ClientSocketEntity extends BaseEntity {
  @Column({ default: '' })
  clientId: string;
  @Column({ default: '' })
  userId: string;
}

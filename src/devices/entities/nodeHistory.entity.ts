import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { SensorsEntity } from './sensors.entity';
import { BatteryEntity } from './battery.entity';
import { NodesEntity } from './nodes.entity';

@Entity({
  name: 'nodeHistory',
})
export class NodeHistoryEntity extends BaseEntity {
  @OneToOne(() => SensorsEntity)
  @JoinColumn()
  sensors: SensorsEntity;
  @OneToOne(() => BatteryEntity)
  @JoinColumn()
  battery: BatteryEntity;
  @Column({ type: 'text', nullable: true }) // Cho phép null
  logger: string | null;
  @ManyToOne(() => NodesEntity, (node) => node.history)
  node: NodesEntity;
}

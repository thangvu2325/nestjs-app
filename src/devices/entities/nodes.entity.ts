import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from 'src/common/mysql/base.entity';
import { Room } from 'src/room/room.entity';
import { DevicesEntity } from './devices.entity';
import { NodeHistoryEntity } from './nodeHistory';

@Entity({
  name: 'nodes',
})
export class NodesEntity extends BaseEntity {
  @Column({ unique: true })
  nodeId: string;
  @Column({ default: '' })
  nodeName: string;
  @OneToMany(() => NodeHistoryEntity, (history) => history.node)
  history: NodeHistoryEntity[];
  @Column({
    type: 'enum',
    enum: [1, 0],
    default: 0,
  })
  AlarmReport: number;
  @Column({
    type: 'enum',
    enum: [1, 0],
    default: 0,
  })
  AlarmSatus: number;
  @OneToOne(() => Room)
  @JoinColumn()
  room: Room;
  @OneToOne(() => Room)
  @JoinColumn()
  historyLoggerRoom: Room;
  @ManyToOne(() => DevicesEntity, (device) => device.nodes)
  @JoinColumn()
  device: DevicesEntity;
}

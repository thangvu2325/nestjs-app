import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { Expose } from 'class-transformer';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @Expose()
  submiter: string;
  @Expose()
  status: 'RESOLVED' | 'IN PROGRESS' | 'PENDING' | 'NEEDS CLARIFICATION';
}

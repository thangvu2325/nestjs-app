import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateRoomDto {
  @ApiProperty()
  @Expose()
  title: string;
  @ApiProperty()
  @Expose()
  description: string;
}

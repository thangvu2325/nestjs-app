import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomController } from './room.controller';
import { Room } from './room.entity';
import { RoomService } from './room.service';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/users/entity/user.entity';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room, UserEntity]), ChatModule],
  controllers: [RoomController],
  providers: [RoomService, JwtService],
})
export class RoomModule {}

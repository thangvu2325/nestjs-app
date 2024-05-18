import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessageController } from './message.controller';
import { Message } from './message.entity';
import { MessageService } from './message.service';
import { JwtService } from '@nestjs/jwt';
import { Room } from 'src/room/room.entity';
import { UserEntity } from 'src/users/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Room, UserEntity])],
  controllers: [MessageController],
  providers: [MessageService, JwtService],
  exports: [MessageService],
})
export class MessageModule {}

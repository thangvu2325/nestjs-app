import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessageController } from './message.controller';
import { Message } from './message.entity';
import { MessageService } from './message.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  controllers: [MessageController],
  providers: [MessageService, JwtService],
  exports: [MessageService],
})
export class MessageModule {}

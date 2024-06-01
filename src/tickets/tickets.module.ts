import 'dotenv/config';
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/users/entity/user.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { ticketsEntity } from './entity/tickets.entity';
import { ticketMessageEntity } from './entity/ticket-message.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([ticketsEntity, UserEntity, ticketMessageEntity]),
  ],
  controllers: [TicketsController],
  providers: [Logger, TicketsService],
  exports: [TicketsService],
})
export class TicketModule {}

import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-tickets.dto';
import { EditTicketDto } from './dto/edit-tickets.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}
  @Get()
  getAllTickets(
    @Query()
    query: {
      startDate: string;
      endDate: string;
      status: string;
      tickedId: string;
      userId: string;
    },
  ) {
    return this.ticketsService.Get(query);
  }
  @Post()
  createTickets(@Body('userId') userId: string, @Body() Dto: CreateTicketDto) {
    return this.ticketsService.createTicket(userId, Dto);
  }

  @Put(':ticketId')
  updateTicket(
    @Body() Dto: EditTicketDto,
    @Param('ticketId') ticketId: string,
  ) {
    console.log(ticketId);
    return this.ticketsService.updateTicket(ticketId, Dto);
  }
}

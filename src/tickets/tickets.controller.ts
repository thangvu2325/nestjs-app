import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-tickets.dto';
import { EditTicketDto } from './dto/edit-tickets.dto';
import { ModGuard } from 'src/auth/guards/mod.guard';

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
  @UseGuards(ModGuard)
  @Get('select')
  async getOldestRoom(@Request() req) {
    return this.ticketsService.getOldestTicket(req['user'].userId);
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

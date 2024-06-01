import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageService } from './message.service';
import { PublicGuard } from 'src/auth/guards/publicRole.guard';

@Controller('messages')
@UseGuards(PublicGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  getMessages(@Query() getMessagesDto: GetMessagesDto) {
    return this.messageService.getMessages(getMessagesDto);
  }

  @Post()
  createMessages(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.createMessage(createMessageDto);
  }
}

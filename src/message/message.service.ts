import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { Message } from './message.entity';
import { Room } from 'src/room/room.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { plainToInstance } from 'class-transformer';
import { UsersDto } from 'src/users/users.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  getMessages(getMessagesDto: GetMessagesDto) {
    return this.messageRepository.findBy({
      room: { id: getMessagesDto.roomId },
    });
  }

  async createMessage(createMessageDto: CreateMessageDto) {
    const message = await this.messageRepository.save(createMessageDto);
    const romFound = await this.roomRepository.findOne({
      where: {
        id: createMessageDto.roomId,
      },
      relations: ['owner', 'messages', 'messages.owner'],
    });
    romFound?.messages.push(message);
    await this.roomRepository.save(romFound);

    const userFound = await this.userRepository.findOne({
      where: {
        id: createMessageDto.userId,
      },
      relations: ['messages'],
    });
    userFound?.messages.push(message);
    await this.userRepository.save(userFound);
    const messageFound = await this.messageRepository.findOne({
      where: {
        id: message.id,
      },
      relations: ['owner'],
    });
    return {
      ...messageFound,
      owner: plainToInstance(UsersDto, messageFound.owner, {
        excludeExtraneousValues: true,
      }),
    };
  }
}

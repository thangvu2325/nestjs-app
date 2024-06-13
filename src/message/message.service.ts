import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
    // Bước 1: Lấy user và room trong một lần gọi cơ sở dữ liệu duy nhất
    const [userFound, roomFound] = await Promise.all([
      this.userRepository.findOne({
        where: { id: createMessageDto.userId },
        relations: ['messages'],
      }),
      this.roomRepository.findOne({
        where: { id: createMessageDto.roomId },
        relations: ['owner', 'messages', 'messages.owner'],
      }),
    ]);
    if (!userFound) {
      throw new HttpException('User Not Found', HttpStatus.FORBIDDEN);
    }

    if (!roomFound) {
      throw new HttpException('Room Not Found', HttpStatus.FORBIDDEN);
    }

    // Bước 2: Tạo và lưu tin nhắn mới
    const message = this.messageRepository.create({
      content: createMessageDto.content,
      owner: userFound,
      room: roomFound,
    });

    // Thêm tin nhắn vào danh sách tin nhắn của user và room
    userFound.messages.push(message);
    roomFound.messages.push(message);

    // Bước 3: Lưu tin nhắn và cập nhật user, room cùng lúc
    await Promise.all([
      this.messageRepository.save(message),
      this.userRepository.save(userFound),
      this.roomRepository.save(roomFound),
    ]);

    // Bước 4: Trả về kết quả với dữ liệu chủ sở hữu được chuyển đổi
    return {
      ...message,
      owner: plainToInstance(UsersDto, userFound, {
        excludeExtraneousValues: true,
      }),
    };
  }
}

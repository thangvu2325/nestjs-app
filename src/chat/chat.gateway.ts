import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/users/entity/user.entity';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { CreateMessageDto } from 'src/message/dto/create-message.dto';
import { MessageService } from 'src/message/message.service';
import { Room } from 'src/room/room.entity';

@WebSocketGateway(55555, { cors: true })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(DevicesEntity)
    private readonly deviceRepository: Repository<DevicesEntity>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly messageService: MessageService,
  ) {}

  private readonly logger = new Logger(ChatGateway.name);
  @WebSocketServer() io: Server;

  async afterInit() {
    this.logger.log('Initialized');
  }
  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const userId = client.handshake.auth.userId;
    const { sockets } = this.io.sockets;
    client.setMaxListeners(20);
    console.log(token, userId);
    if (!token || !userId) {
      client.disconnect();
      return;
    }
    try {
      const decodedToken = await this.jwtService.verifyAsync(token, {
        secret: process.env.jwtSecretKey,
      });
      if (!decodedToken) {
        console.log(decodedToken);
        client.disconnect();
        return;
      }
      this.logger.log(`Client id: ${client.id} connected`);
      this.logger.debug(`Number of connected clients: ${sockets.size}`);
    } catch (error) {
      this.logger.error(`Error during connection: ${error.message}`);
      client.disconnect();
    }
  }

  async getUserIdListbyDeviceId(deviceId: string): Promise<Array<string>> {
    try {
      const userList = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.customer', 'customer')
        .leftJoinAndSelect('customer.devices', 'devices')
        .where('devices.deviceId = :deviceId', { deviceId })
        .getMany();

      if (!userList) {
        throw 'thiết bị này chưa kết nối với người dùng nào';
      }

      return userList.map((user) => user.id);
    } catch (error) {
      this.logger.error(`Error fetching user: ${error.message}`);
      throw 'error';
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client id:${client.id} disconnected`);
  }

  @SubscribeMessage('ping')
  handleMessagePing(client: Socket, data: any) {
    let count = 0;
    this.logger.log(`Message received from client id: ${client.id}`);
    this.logger.debug(`Payload: ${data}`);
    const intervalId = setInterval(() => {
      this.sendMessageToClient(client.id, Math.random(), 'message-received');
      count++;
      if (count === 10) {
        clearInterval(intervalId);
      }
    }, 2000);

    return {
      event: 'pong',
      data,
    };
  }

  async sendDeviceDataToRoom(deviceId: string, message: any) {
    const device = await this.deviceRepository.findOne({
      where: {
        deviceId,
      },
      relations: ['room'],
    });
    if (!device) {
      this.logger.error(`Thiết bị không tồn tại`);
      return;
    }
    this.io.to(device.room?.id.toString()).emit('message', message);
    this.logger.log(
      `Gửi message đến room ${device.room.id} của thiết bị ${device.deviceId} thành công`,
    );
  }
  async sendLoggerDataToRoom(deviceId: string, message: any) {
    const device = await this.deviceRepository.findOne({
      where: {
        deviceId,
      },
      relations: ['historyLoggerRoom'],
    });
    if (!device) {
      this.logger.error(`Thiết bị không tồn tại`);
      return;
    }
    this.io.to(device.historyLoggerRoom.id.toString()).emit('message', message);
    this.logger.log(
      `Gửi message đến room ${device.historyLoggerRoom.id.toString()} của thiết bị ${
        device.deviceId
      } thành công`,
    );
  }
  firstMessageToRoom(roomId: string, message: string) {
    this.io.to(roomId.toString()).emit('message', message);
  }
  sendMessageToClient(clientId: string, message: any, topic: string) {
    const clientSocket = this.io.sockets.sockets.get(clientId);
    if (clientSocket) {
      clientSocket.emit(topic, message);
      this.logger.log(`Message sent to client ${clientId}`);
    } else {
      this.logger.error(`Client ${clientId} not found`);
    }
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, roomId: string) {
    console.log(`${client.handshake.auth.userId} đang vào ${roomId}`);
    if (roomId) {
      client.join(roomId);
    }
    return roomId;
  }
  @SubscribeMessage('leave')
  handleLeave(client: Socket, roomId: string) {
    client.leave(roomId.toString());
    console.log(client._cleanup());
    return roomId;
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, message: string) {
    try {
      const createMessageDto: CreateMessageDto = {
        ...JSON.parse(message),
        userId: client.handshake.auth.userId,
      };
      const text = await this.messageService.createMessage(createMessageDto);
      this.io.to(createMessageDto.roomId).emit(
        'message',
        JSON.stringify({
          type: 'message',
          message: text,
        }),
      );
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
  @SubscribeMessage('handleRoom')
  async handleRoomChangeStatus(client: Socket, roomId) {
    const room = await this.roomRepository
      .createQueryBuilder('rooms')
      .leftJoinAndSelect('rooms.owner', 'roomOwner') // Renamed to 'roomOwner'
      .leftJoinAndSelect('rooms.messages', 'messages')
      .leftJoinAndSelect('messages.owner', 'messageOwner') // Renamed to 'messageOwner'
      .leftJoinAndSelect('rooms.submiter', 'submiter')
      .leftJoinAndSelect('roomOwner.customer', 'customer')
      .where('rooms.id = :roomId', { roomId }) // Use 'rooms.id' to specify the alias
      .getOne(); // Assuming you want a single result
    client.broadcast.to(roomId).emit(
      'message',
      JSON.stringify({
        type: 'handleRoom',
        message: JSON.stringify({
          ...room,
          owner: room?.owner?.customer?.customer_id || null,
          submiter: room?.submiter?.id || null,
          messages: room?.messages?.sort((a, b) => {
            return (
              new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            );
          }),
        }),
      }),
    );
  }
  @SubscribeMessage('isTyping')
  async handleTypingNotification(client: Socket, roomId: string) {
    const userFound = await this.userRepository.findOne({
      where: {
        id: client.handshake.auth.userId,
      },
      relations: ['customer'],
    });

    if (userFound && userFound.customer) {
      const typingMessage = `${userFound.customer.last_name} ${userFound.customer.first_name} (${userFound.email}) is typing`;
      client.broadcast.to(roomId).emit(
        'message',
        JSON.stringify({
          type: 'isTyping',
          message: typingMessage,
        }),
      );
    }
  }
}

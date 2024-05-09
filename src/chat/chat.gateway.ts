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
import { ClientSocketEntity } from './clientSocket.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { CreateMessageDto } from 'src/message/dto/create-message.dto';
import { MessageService } from 'src/message/message.service';

@WebSocketGateway(55555, { cors: true })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private jwtService: JwtService,
    @InjectRepository(ClientSocketEntity)
    private readonly clientSocketRepository: Repository<ClientSocketEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(DevicesEntity)
    private readonly deviceRepository: Repository<DevicesEntity>,
    private readonly messageService: MessageService,
  ) {}

  private readonly logger = new Logger(ChatGateway.name);
  @WebSocketServer() io: Server;

  async afterInit() {
    this.logger.log('Initialized');
    this.io.setMaxListeners(20);
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const userId = client.handshake.auth.userId;
    const { sockets } = this.io.sockets;
    client.setMaxListeners(20);
    if (!token || !userId) {
      client.disconnect();
      return;
    }
    try {
      const decodedToken = await this.jwtService.verifyAsync(token, {
        secret: process.env.jwtSecretKey,
      });
      if (!decodedToken) {
        client.disconnect();
        return;
      }
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.log(`User not found`);
        client.disconnect();
        return;
      }
      await this.clientSocketRepository.save({
        clientId: client.id,
        userId: userId,
      });
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
    await this.clientSocketRepository.delete({ clientId: client.id });
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

  async sendDeviceDataToClient(
    deviceId: string,
    message: any,
    topic: string = 'deviceMessage',
  ) {
    const userIdList = await this.getUserIdListbyDeviceId(deviceId);
    const clients: string[] = [];
    userIdList.forEach(async (userId) => {
      const socketClients = await this.clientSocketRepository.find({
        where: {
          userId,
        },
      });
      if (!socketClients.length) {
        this.logger.log(`User not connected`);
        return;
      }
      for (const client of socketClients) {
        if (!clients.includes(client.clientId)) {
          clients.push(client.clientId);
          const socket = this.io.sockets.sockets.get(client.clientId);
          if (socket) {
            socket.emit(topic, message);
            this.logger.log(`Message sent to client ${client.clientId}`);
          } else {
            this.logger.error(`Client ${client.clientId} not found`);
          }
        }
      }
    });
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
  handleJoin(client: Socket, roomId: number) {
    client.join(roomId.toString());
    return roomId;
  }

  @SubscribeMessage('leave')
  handleLeave(client: Socket, roomId: number) {
    client.leave(roomId.toString());
    return roomId;
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, createMessageDto: CreateMessageDto) {
    const message = await this.messageService.createMessage(createMessageDto);
    client.emit('message', message);
    client.to(message.room.toString()).emit('message', message);
  }

  @SubscribeMessage('isTyping')
  async handleTypingNotification(client: Socket, roomId: CreateMessageDto) {
    client
      .to(roomId.toString())
      .emit('isTyping', `${client.id} typing message...`);
  }
}

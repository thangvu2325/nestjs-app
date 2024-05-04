/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger, UnauthorizedException } from '@nestjs/common';
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
import { ClientSocketEntity } from './clientSocket.entity';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/users/entity/user.entity';
import { DevicesEntity } from 'src/devices/entities/devices.entity';

@WebSocketGateway(55555, { cors: true })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private jwtService: JwtService,
    @InjectRepository(ClientSocketEntity)
    private readonly clientSocketReposity: Repository<ClientSocketEntity>,
    @InjectRepository(UserEntity)
    private readonly userReposity: Repository<UserEntity>,
    @InjectRepository(DevicesEntity)
    private readonly deviceReposity: Repository<DevicesEntity>,
  ) {
    this.clientSocketReposity.clear();
  }
  private readonly logger = new Logger(ChatGateway.name);
  @WebSocketServer() io: Server;
  afterInit() {
    this.logger.log('Initialized');
  }
  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const userId = client.handshake.auth.userId;
    const { sockets } = this.io.sockets;
    if (!token) {
      client.disconnect();
      return;
    }
    console.log(process.env.WEBSOCKET_PORT);

    try {
      const decodedToken = await this.jwtService.verifyAsync(token, {
        secret: process.env.jwtSecretKey,
      });

      if (!decodedToken || !userId) {
        client.disconnect();
        return;
      }

      const userFound = userId
        ? await this.userReposity.findOne({
            where: {
              id: userId,
            },
          })
        : false;
      if (!userFound) {
        this.logger.log(`Khong ton tai nguoi dung nay`);
        client.disconnect();
        return;
      }
      await this.clientSocketReposity.save({
        clientId: client.id,
        userId: userId,
      });

      this.logger.log(
        `Client id: ${client.id} có userId: ${client.handshake.auth.userId} connected`,
      );
      this.logger.debug(`Number of connected clients: ${sockets.size}`);
    } catch (error) {
      console.log(error);
      client.disconnect();
    }
  }

  async getUserId(deviceId: string): Promise<string | 'not found' | 'error'> {
    try {
      const userList = await this.userReposity
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.customer', 'customer')
        .leftJoinAndSelect('customer.devices', 'devices')
        .getMany();

      const userFound = userList.find((user) => {
        return user.customer.devices.some((device) => {
          return device.deviceId === deviceId;
        });
      });

      if (!userFound) {
        return 'not found';
      }

      // Assuming userFound has a property called 'id'
      return userFound.id;
    } catch (error) {
      console.error('Error occurred while fetching user:', error);
      return 'error';
    }
  }
  async handleDisconnect(client: Socket) {
    this.logger.log(`Cliend id:${client.id} disconnected`);
    await this.clientSocketReposity.delete({
      clientId: client.id,
    });
  }
  @SubscribeMessage('ping')
  handleMessage(client: Socket, data: any) {
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

  async sendDeviceDataToClient(deviceId: string, message: any) {
    const userId = await this.getUserId(deviceId);
    const clients = [];
    const socketClient = await this.clientSocketReposity.find({
      where: {
        userId,
      },
    });
    if (!socketClient.length) {
      this.logger.log(`Người dùng không kết nối `);
    }
    socketClient.forEach((client) => {
      console.log(client.clientId);
      const find = clients.findIndex((item) => item === client.clientId);
      if (find === -1) {
        clients.push(client.clientId);
        const clientSocket = this.io.sockets.sockets.get(client.clientId);
        if (clientSocket) {
          clientSocket.emit('deviceMessage', message);
          // You can also use clientSocket.send(message); if it suits your use case better
          this.logger.log(`Message sent to client ${client.clientId}`);
        } else {
          this.logger.error(`Client ${client.clientId} not found`);
        }
      }
    });
    console.log(clients);
  }
  // Method to send message to a client
  sendMessageToClient(clientId: string, message: any, topic: string) {
    const clientSocket = this.io.sockets.sockets.get(clientId);
    if (clientSocket) {
      clientSocket.emit(topic, message);
      // You can also use clientSocket.send(message); if it suits your use case better
      this.logger.log(`Message sent to client ${clientId}`);
    } else {
      this.logger.error(`Client ${clientId} not found`);
    }
  }
}

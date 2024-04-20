/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway(3006, { cors: true })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private jwtService: JwtService) {}
  private readonly logger = new Logger(ChatGateway.name);
  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log('Initialized');
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const { sockets } = this.io.sockets;
    const payload = token
      ? await this.jwtService.verifyAsync(token, {
          secret: process.env.jwtSecretKey,
        })
      : false;

    if (!payload) {
      client.disconnect(true);
    } else {
      this.logger.log(
        `Client id: ${client.id} có customer_id: ${client.handshake.auth.customer_id} connected`,
      );
      this.logger.debug(`Number of connected clients: ${sockets.size}`);
    }
  }

  handleDisconnect(client: any) {
    this.logger.log(`Cliend id:${client.id} disconnected`);
  }

  @SubscribeMessage('ping')
  handleMessage(client: any, data: any) {
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

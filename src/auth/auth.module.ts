import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RedisModule } from 'src/redis/redis.module';
import { PassportModule } from '@nestjs/passport';
import { MailService } from 'src/mail/mail.service';
import { CustomersModule } from 'src/customers/customers.module';
import { CustomersService } from 'src/customers/customers.service';
import { DevicesService } from 'src/devices/devices.service';
import { MessageService } from 'src/message/message.service';
import { NotificationService } from 'src/notification/notification.service';
import { ChatModule } from 'src/chat/chat.module';
import { DatabaseModule } from 'src/common/database.module';
import { SecretKeyEntity } from './entity/secretKey.entity';
import { NodeServices } from 'src/devices/nodes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SecretKeyEntity]),
    DatabaseModule, // Add DevicesEntity here
    CustomersModule,
    RedisModule,
    PassportModule,
    ChatModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    JwtService,
    MailService,
    CustomersService,
    Logger,
    DevicesService,
    MessageService,
    NotificationService,
    NodeServices,
  ],
  exports: [AuthService],
})
export class AuthModule {}

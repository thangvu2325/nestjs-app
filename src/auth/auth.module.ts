import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RedisModule } from 'src/redis/redis.module';
import { PassportModule } from '@nestjs/passport';
import { MailService } from 'src/mail/mail.service';
import { CustomersModule } from 'src/customers/customers.module';
import { CustomersService } from 'src/customers/customers.service';
import { CustomersEntity } from 'src/customers/customers.entity';
import { DevicesEntity } from 'src/devices/entities/devices.entity';
import { UserEntity } from 'src/users/entity/user.entity';
import { VerifyEntity } from 'src/users/entity/verifyKey.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomersEntity, DevicesEntity, VerifyEntity]), // Add DevicesEntity here
    TypeOrmModule.forFeature([UserEntity]),
    UsersModule,
    CustomersModule,
    RedisModule,
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    JwtService,
    MailService,
    CustomersService,
    Logger,
  ],
  exports: [AuthService],
})
export class AuthModule {}

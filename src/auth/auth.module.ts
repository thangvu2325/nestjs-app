import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { UserEntity } from 'src/users/user.entity';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomersEntity]),
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
  ],
  exports: [AuthService],
})
export class AuthModule {}

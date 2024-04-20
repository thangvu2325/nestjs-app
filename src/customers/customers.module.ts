import { Module } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { CustomersEntity } from './customers.entity';
import { UsersService } from 'src/users/users.service';
import { CustomersController } from './customers.controller';
import { UserEntity } from 'src/users/user.entity';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomersEntity]),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService, LoggerService, MailService, UsersService],
  exports: [CustomersService],
})
export class CustomersModule {}

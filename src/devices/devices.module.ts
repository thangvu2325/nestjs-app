import { Logger, Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { CustomersService } from 'src/customers/customers.service';
import { MailService } from 'src/mail/mail.service';
import { UsersService } from 'src/users/users.service';
import { MessageService } from 'src/message/message.service';
import { NotificationService } from 'src/notification/notification.service';
import { ChatModule } from 'src/chat/chat.module';
import { WarningLogsService } from './warningLogs.service';
import { WarningLogsController } from './warningLogs.controller';
import { DatabaseModule } from 'src/common/database.module';
import { NodeServices } from './nodes.service';

@Module({
  imports: [DatabaseModule, ChatModule, JwtModule],
  controllers: [DevicesController, HistoryController, WarningLogsController],
  providers: [
    DevicesService,
    JwtService,
    HistoryService,
    CustomersService,
    MailService,
    UsersService,
    WarningLogsService,
    Logger,
    MessageService,
    MailService,
    NotificationService,
    NodeServices,
  ],
  exports: [DevicesService, NodeServices, HistoryService, WarningLogsService],
})
export class DevicesModule {}

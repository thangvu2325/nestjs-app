import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersDto } from './users.dto';
import { UsersService } from './users.service';
import { plainToInstance } from 'class-transformer';
import { NotificationDto } from 'src/notification/dto/create-notification.dto';
import { UpdateNotificationDto } from 'src/notification/dto/update-notification.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllUser() {
    return this.usersService.findAll({});
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<UsersDto> {
    const userFounded = await this.usersService.findOne({
      where: {
        id: id,
      },
    });
    return plainToInstance(UsersDto, userFounded, {
      excludeExtraneousValues: true,
    });
  }
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Body() update_dto: any, @Param('id') user_id: string) {
    return await this.usersService.updateProfile(user_id, update_dto);
  }
  @Put('push/enable/:id')
  @HttpCode(HttpStatus.OK)
  async enablePush(
    @Body() update_dto: NotificationDto,
    @Param('id') user_id: string,
  ) {
    return await this.usersService.enablePush(user_id, update_dto);
  }

  @Put('push/disable/:id')
  @HttpCode(HttpStatus.OK)
  async disablePush(
    @Param('id') user_id: string,
    @Body() update_dto: UpdateNotificationDto,
  ) {
    return await this.usersService.disablePush(user_id, update_dto);
  }
  @Post('push/disable/:id')
  @HttpCode(HttpStatus.OK)
  async send(
    @Param('id') user_id: string,
    @Body() update_dto: UpdateNotificationDto,
  ) {
    return await this.usersService.disablePush(user_id, update_dto);
  }
  @Get('push/notifications')
  @HttpCode(HttpStatus.OK)
  async fetchPusNotifications() {
    return await this.usersService.getPushNotifications();
  }
  @Post('push/notifications/:id')
  @HttpCode(HttpStatus.OK)
  async sendNotifications(@Param('id') userId: string) {
    return this.usersService.sendWarningtoClient(userId, 'test', 'test');
  }
  @Post()
  async createUser(@Body() user: UsersDto): Promise<{ result: string }> {
    return await this.usersService.createUser(user);
  }
  @Post(':secretKey')
  createUserRoleModerator(@Body() user: UsersDto): Promise<UsersDto[]> {
    return this.usersService.save({ ...user, role: 'Moderator' });
  }
  @Delete(':id')
  deleteUser(@Param() id: string): Promise<{ result: string }> {
    return this.usersService.deleteById(id);
  }

  @Post(':email/roles')
  updateRoles(
    @Body() body: { roles: string; action: 'up' | 'down' },
    @Param('email') email: string,
  ): Promise<{ result: string }> {
    return this.usersService.updateRoles(email, body.roles, body.action);
  }
}

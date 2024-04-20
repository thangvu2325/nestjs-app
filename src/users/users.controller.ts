import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { UsersDto } from './users.dto';
import { UsersService } from './users.service';
import { plainToInstance } from 'class-transformer';

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
  updateUserById(
    @Param('id') id: string,
    @Body() user: UsersDto,
  ): Promise<{ result: string }> {
    return this.usersService.update(id, user);
  }
  @Post()
  createUser(@Body() user: UsersDto): Promise<UsersDto[]> {
    return this.usersService.save(user);
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

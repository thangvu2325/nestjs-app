import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersDto } from './customers.dto';
import { UsersService } from 'src/users/users.service';
import { DevicesDto } from 'src/devices/dto/devices.dto';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
  ) {}
  @Get()
  getAllCustomer(): Promise<{
    customers: Array<CustomersDto>;
    customersCount: number;
  }> {
    return this.customersService.findAll({});
  }
  @Post(':userId')
  createCustomer(
    @Param('userId') userId: string,
    @Body() Dto: CustomersDto,
  ): Promise<{
    result: string;
  }> {
    return this.customersService.saveCustomer(userId, Dto);
  }
  @Post('/device/:customer_id')
  addDevice(
    @Body() Dto: DevicesDto,
    @Param('customer_id') customer_id: string,
  ): Promise<{
    result: string;
  }> {
    return this.customersService.addDevice(Dto, customer_id);
  }
}

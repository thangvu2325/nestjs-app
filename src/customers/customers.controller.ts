import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersDto } from './customers.dto';
import { UsersService } from 'src/users/users.service';

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
    console.log(Dto);
    return this.customersService.saveCustomer(userId, Dto);
  }
}

import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Delete,
  UseFilters,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './Dto/auth.dto';
import { UsersDto } from 'src/users/users.dto';
import { RefreshJwtGuard } from './guards/refresh.guard';
import { RedisService } from 'src/redis/redis.service';
import { JwtGuard } from './guards/jwt.guard';
import { HttpExceptionFilter } from 'src/http-exception.filter';

@Controller('auth')
export class AuthController {
  constructor(
    private userService: UsersService,
    private authService: AuthService,
    private readonly redisService: RedisService,
  ) {}
  @UseFilters(new HttpExceptionFilter())
  @Post('register')
  async registerUser(@Body() dto: UsersDto) {
    return this.authService.register(dto);
  }
  @UseGuards(JwtGuard)
  @Post('resetpassword')
  async resetPassword(
    @Body() data: { email: string },
  ): Promise<{ newPassword: string }> {
    console.log(data.email);
    return await this.userService.requestResetPassword(data.email);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }

  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  async refreshToken(@Request() req) {
    return await this.authService.refreshToken(req.user);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  async logout(@Body() user: UsersDto): Promise<{ result: string }> {
    return await this.authService.logout(user.id);
  }
  // Token
  @Get('getalltokens')
  async getAllToken() {
    return await this.redisService.getAllTokens();
  }

  @Delete('deletealltokens')
  async deleteAllToken(): Promise<{ result: string }> {
    return await this.redisService.deleteAllTokens();
  }
}

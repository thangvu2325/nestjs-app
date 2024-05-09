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
  @Post('register/:secretKey')
  async registerUserWithRoleModerator(@Body() dto: UsersDto) {
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

  @UseGuards(JwtGuard)
  @Post('checkactive')
  async checkActive(
    @Body('userId') userId: string,
  ): Promise<{ result: string }> {
    return await this.authService.checkActive(userId);
  }

  @Post('checkemailexist')
  async checkEmailExis(
    @Body('email') email: string,
  ): Promise<{ result: string }> {
    return await this.authService.checkEmailExist(email);
  }
  @Post('checksmsexist')
  async checkSmsExis(
    @Body('phone') phone: string,
  ): Promise<{ result: string }> {
    return await this.authService.checkSmsExist(phone);
  }
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
  @Post('verify')
  verifyAccount(@Body() dto: { secretKey: number; email: string }) {
    return this.authService.verifyAccount(dto.secretKey, dto.email);
  }
  @Post('resend')
  resendSecretKey(@Body() dto: { email: string }) {
    return this.authService.resendVerifyKey(dto.email);
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

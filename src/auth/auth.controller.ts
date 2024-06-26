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
import { HttpExceptionFilter } from 'src/http-exception.filter';
import { PublicGuard } from './guards/publicRole.guard';
import { ChangePasswordDto } from './Dto/changePassword.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private userService: UsersService,
    private authService: AuthService,
    private readonly redisService: RedisService,
  ) {}
  // User
  @UseFilters(new HttpExceptionFilter())
  @Post('register')
  async registerUser(@Body() dto: UsersDto) {
    return this.authService.register(dto);
  }
  @UseGuards(PublicGuard)
  @Post('changepassword')
  async changePassword(
    @Body('email') email: string,
    @Body() dto: ChangePasswordDto,
  ) {
    console.log(1);
    return this.authService.changePassword(email, dto);
  }

  @UseGuards(PublicGuard)
  @Post('resetpassword')
  async resetPassword(
    @Body() data: { email: string },
  ): Promise<{ newPassword: string }> {
    console.log(data.email);
    return await this.userService.requestResetPassword(data.email);
  }
  @UseGuards(PublicGuard)
  @Post('checkactive')
  checkActive(@Body('userId') userId: string): Promise<{ result: string }> {
    return this.authService.checkActive(userId);
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
  @UseGuards(PublicGuard)
  @Post('logout')
  async logout(@Body() user: UsersDto): Promise<{ result: string }> {
    return await this.authService.logout(user.id);
  }

  // Manager
  @Post('manager/register')
  async registerUserWithRoleModerator(
    @Body() dto: UsersDto,
    @Body('secretKey') secretKey: string,
  ) {
    return this.authService.register(dto, secretKey, 'require');
  }
  @Post('manager/login')
  async LoginModerator(@Body() dto: UsersDto) {
    return this.authService.login(dto, 'require');
  }
  @Post('manager/secretKey')
  createSecretKey(
    @Body('role') role: 'Administrator' | 'Moderator' | 'User' = 'Moderator',
  ) {
    return this.authService.createSecretKey(role);
  }
  @Post('manager/checksecretKey')
  async checkSecretKey(
    @Body('secretKey') secretKey: string,
  ): Promise<{ result: string }> {
    return await this.authService.checkSecretKey(secretKey);
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

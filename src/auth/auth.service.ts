import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './Dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';
import { UsersDto } from 'src/users/users.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { CustomersService } from 'src/customers/customers.service';
import { CustomersDto } from 'src/customers/customers.dto';
import { UserEntity } from 'src/users/entity/user.entity';
const EXPIRE_TIME = 20 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly userService: UsersService,
    private readonly customersService: CustomersService,
    private jwtService: JwtService,
    private readonly redisTokenService: RedisService,
  ) {}
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto);
    const customer = plainToInstance(CustomersDto, user.customer, {
      excludeExtraneousValues: true,
    });
    const payload = {
      email: user.email,
      sub: {
        role: user.role,
      },
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '20s',
      secret: process.env.jwtSecretKey,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: process.env.jwtRefreshTokenKey,
    });
    // Lưu Refresh Token vào Redis
    await this.redisTokenService.saveRefreshToken(user.id, refreshToken);
    return {
      user: plainToClass(
        UsersDto,
        {
          customer_id: customer?.customer_id ?? '',
          ...user,
        },
        { excludeExtraneousValues: true },
      ),
      backendTokens: {
        accessToken,
        refreshToken,
        expiresIn: new Date().setTime(new Date().getTime() + EXPIRE_TIME),
      },
    };
  }
  async register(dto: UsersDto) {
    try {
      const result = await this.userService.createUser(dto);
      return result;
    } catch (error) {
      console.error('Error while registering user:', error);
      throw new Error(`Failed to register user: ${error.message}`);
    }
  }

  async logout(userId: string): Promise<{ result: string }> {
    // Lưu Refresh Token vào Redis
    await this.redisTokenService.deleteTokenForUser(userId);
    return { result: 'success' };
  }
  async validateUser(dto: LoginDto) {
    const user = await this.userService.findOneUserWithEmail(dto.email);
    if (user && (await compare(dto.password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException();
  }
  async verifyToken(token: string) {
    return await this.jwtService.verify(token, {
      secret: process.env.jwtSecretKey,
    });
  }
  async refreshToken(userDto: UsersDto) {
    const user = await this.userService.findOneUserWithEmail(userDto.email);
    const payload = {
      email: user.email,
      sub: {
        role: user.role,
      },
    };
    const customer = plainToInstance(CustomersDto, user.customer, {
      excludeExtraneousValues: true,
    });
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '20s',
      secret: process.env.jwtSecretKey,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: process.env.jwtRefreshTokenKey,
    });
    // Lưu Refresh Token vào Redis
    await this.redisTokenService.saveRefreshToken(user.id, refreshToken);

    return {
      user: plainToClass(
        UsersDto,
        {
          customer_id: customer?.customer_id ?? '',
          ...user,
        },
        { excludeExtraneousValues: true },
      ),
      backendTokens: {
        accessToken,
        refreshToken,
        expiresIn: new Date().setTime(new Date().getTime() + EXPIRE_TIME),
      },
    };
  }
}

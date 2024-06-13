import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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
import { SecretKeyEntity } from './entity/secretKey.entity';
const EXPIRE_TIME = 86400000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SecretKeyEntity)
    private readonly secretRepository: Repository<SecretKeyEntity>,
    private readonly userService: UsersService,
    private readonly customersService: CustomersService,
    private jwtService: JwtService,
    private readonly redisTokenService: RedisService,
  ) {}
  generateUniqueId(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 12;
    let uniqueId = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      uniqueId += characters.charAt(randomIndex);
    }

    return uniqueId;
  }

  async login(dto: LoginDto, type: 'default' | 'require' = 'default') {
    const user = await this.validateUser(dto);
    const customer = plainToInstance(CustomersDto, user.customer, {
      excludeExtraneousValues: true,
    });
    if (type === 'require' && user.role === 'User') {
      throw new HttpException(
        'Bạn Không Có Quyền Truy Cập!',
        HttpStatus.FORBIDDEN,
      );
    }
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
      secret: process.env.jwtSecretKey,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: process.env.jwtRefreshTokenKey,
    });
    // Lưu Refresh Token vào Redis
    await this.redisTokenService.saveRefreshToken(user.id, refreshToken);
    const roomNewest = user.rooms
      .filter((room) => room?.status !== 'RESOLVED')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    return {
      user: plainToClass(
        UsersDto,
        {
          customer_id: customer?.customer_id ?? '',
          ...user,
          room_id: roomNewest ? roomNewest.id : null,
          fullName: user.customer.last_name + ' ' + user.customer.first_name,
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
  async register(
    dto: UsersDto,
    secretKey?: string,
    type: 'default' | 'require' = 'default',
  ) {
    try {
      if (type !== 'default' && secretKey) {
        const secretFound = await this.secretRepository.findOne({
          where: { secretKey },
        });

        if (!secretFound || secretFound.isUse) {
          throw new HttpException(
            'Mã Secret key không đúng hoặc đã được sử dụng',
            HttpStatus.FORBIDDEN,
          );
        }

        secretFound.isUse = true;
        await this.secretRepository.save(secretFound);

        return await this.userService.createUser({
          ...dto,
          role: secretFound.role,
        });
      }

      return await this.userService.createUser(dto);
    } catch (error) {
      console.error('Error while registering user:', error);
      throw new HttpException(
        `Failed to register user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async createSecretKey(
    role: 'Administrator' | 'Moderator' | 'User' = 'Moderator',
  ) {
    const secretKey = this.secretRepository.save({
      secretKey: this.generateUniqueId(),
      role,
    });
    return secretKey;
  }
  async verifyAccount(secretKey: number, email: string) {
    try {
      const result = await this.userService.checkVerifyKey(secretKey, email);
      return result;
    } catch (error) {
      console.error('Error while verify:', error);
      throw new Error(`Failed to verify: ${error.message}`);
    }
  }
  async resendVerifyKey(email: string) {
    const result = await this.userService.createVerifyKey(email);
    return result;
  }
  async logout(userId: string): Promise<{ result: string }> {
    // Lưu Refresh Token vào Redis
    await this.redisTokenService.delRFToken(userId);
    return { result: 'success' };
  }
  async validateUser(dto: LoginDto) {
    const user = await this.userService.findOneUserWithEmail(dto.email);
    if (user && (await compare(dto.password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    throw new HttpException(
      'Sai thông tin tài khoản hoặc mật khẩu',
      HttpStatus.FORBIDDEN,
    );
  }
  async verifyToken(token: string) {
    return await this.jwtService.verify(token, {
      secret: process.env.jwtSecretKey,
    });
  }
  async checkActive(userId: string): Promise<{ result: string }> {
    const userFound = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    if (!userFound) {
      throw new HttpException('Không tồn tại user này', HttpStatus.FORBIDDEN);
    }
    if (!userFound.isActive) {
      throw new HttpException('Tài khoản chưa kích hoạt', HttpStatus.FORBIDDEN);
    }
    return { result: 'Tài Khoản đã kích hoạt!' };
  }
  async checkEmailExist(email: string): Promise<{ result: string }> {
    const userFound = await this.userService.findOneUserWithEmail(email);
    if (userFound) {
      throw new HttpException(
        'Email này đã được sử dụng!',
        HttpStatus.FORBIDDEN,
      );
    }
    return { result: 'Email này chưa được sử dụng' };
  }
  async checkSecretKey(secretKey: string): Promise<{ result: string }> {
    const secretKeyFound = await this.secretRepository.findOne({
      where: {
        secretKey,
      },
    });
    if (!secretKeyFound || secretKeyFound.isUse) {
      throw new HttpException(
        'secretKey này không tồn tại hoặc đã sử dụng!',
        HttpStatus.FORBIDDEN,
      );
    }
    return { result: 'secretKey này chưa được sử dụng' };
  }
  async checkSmsExist(phone: string): Promise<{ result: string }> {
    const userFound = await this.userRepository.findOne({
      where: {
        phone,
      },
    });
    if (userFound) {
      throw new HttpException(
        'Số điện thoại này đã được sử dụng!',
        HttpStatus.FORBIDDEN,
      );
    }
    return { result: 'Số điện thoại này chưa được sử dụng' };
  }
  async refreshToken(userDto: UsersDto) {
    const user = await this.userService.findOneUserWithEmail(userDto.email);
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const customer = plainToInstance(CustomersDto, user.customer, {
      excludeExtraneousValues: true,
    });
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
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

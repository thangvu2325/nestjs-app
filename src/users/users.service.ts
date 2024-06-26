import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersDto } from './users.dto';
import { Repository } from 'typeorm';
import { MysqlBaseService } from 'src/common/mysql/base.service';
import { plainToClass, plainToInstance } from 'class-transformer';
import { MailService } from 'src/mail/mail.service';
import { CustomersDto } from 'src/customers/customers.dto';
import { UserEntity } from './entity/user.entity';
import { CustomersService } from 'src/customers/customers.service';
import * as bcrypt from 'bcrypt';
import { VerifyEntity } from './entity/verifyKey.entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationDto } from 'src/notification/dto/create-notification.dto';
import { UpdateNotificationDto } from 'src/notification/dto/update-notification.dto';

@Injectable()
export class UsersService extends MysqlBaseService<UserEntity, UsersDto> {
  constructor(
    // @Inject('STORE_SERVICEuser.json') private storeService: StoreService,
    @InjectRepository(UserEntity)
    private readonly userReposity: Repository<UserEntity>,
    @InjectRepository(VerifyEntity)
    private readonly verifyReposity: Repository<VerifyEntity>,
    private readonly mailService: MailService,
    private readonly customerService: CustomersService,
    private readonly logger: Logger,
    private readonly notificationService: NotificationService,
  ) {
    super(userReposity, UsersDto);
  }
  async findAll(
    query,
  ): Promise<{ users: Array<UsersDto>; usersCount: number }> {
    const qb = await this.userReposity
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.customer', 'customers')
      .leftJoinAndSelect('user.rooms', 'rooms')
      .where('user.role = :role', { role: 'User' });

    qb.orderBy('user.createdAt', 'DESC'); // Corrected the alias to 'posts'

    const usersCount = await qb.getCount();

    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    const users = await qb.getMany();
    const usersDtoArray = users
      .filter((user) => user.role !== 'Admin')
      .map((user) => {
        const customer = user.customer
          ? plainToInstance(CustomersDto, user.customer, {
              excludeExtraneousValues: true,
            })
          : null;
        // const roomNewest = user.rooms
        //   .filter((room) => room?.status !== 'RESOLVED')
        //   .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

        return plainToClass(
          UsersDto,
          {
            ...user,
            customer,
            fullName: user.customer.last_name + ' ' + user.customer.first_name,
            // room_id: roomNewest ? roomNewest.id : null,
          },
          { excludeExtraneousValues: true },
        );
      });

    return { users: usersDtoArray, usersCount };
  }
  async findOneUserWithEmail(email: string): Promise<UserEntity | null> {
    const user = await this.userReposity
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .leftJoinAndSelect('user.customer', 'customers')
      .getOne();

    return user || null;
  }
  updateProfile = async (
    user_id: string,
    update_dto: UsersDto,
  ): Promise<any> => {
    try {
      const user = await this.userReposity.findOne({
        where: { id: user_id },
      });
      const updated_user = {
        ...user,
        ...update_dto,
      };
      const saved_user = await this.userReposity.save(updated_user);
      if (saved_user) {
        // send push notification
        await this.notificationService
          .sendPush(
            updated_user,
            'Profiie update',
            'Your Profile have been updated successfully',
          )
          .catch((e) => {
            console.log('Error sending push notification', e);
          });
      }
      return saved_user;
    } catch (error) {
      return error;
    }
  };
  enablePush = async (
    user_id: string,
    update_dto: NotificationDto,
  ): Promise<any> => {
    const user = await this.userReposity.findOne({
      where: { id: user_id },
    });
    console.log(update_dto);
    return await this.notificationService.acceptPushNotification(
      user,
      update_dto,
    );
  };
  sendWarningtoClient = async (
    email: string,
    title: string,
    body: string,
  ): Promise<any> => {
    const user = await this.userReposity.findOne({
      where: { email: email },
    });
    if (!user) {
      throw new HttpException('Không tìm thấy User', HttpStatus.FORBIDDEN);
    }
    const userDto = plainToInstance(UsersDto, user, {
      excludeExtraneousValues: true,
    });
    await this.notificationService.sendPush(userDto, title, body);
    return 'thành công';
  };
  disablePush = async (
    user_id: string,
    update_dto: UpdateNotificationDto,
  ): Promise<any> => {
    const user = await this.userReposity.findOne({
      where: { id: user_id },
    });
    return await this.notificationService.disablePushNotification(
      user,
      update_dto,
    );
  };
  getPushNotifications = async (): Promise<any> => {
    return await this.notificationService.getNotifications();
  };
  async createUser(userDto: UsersDto) {
    const user = await this.userReposity.save({
      ...userDto,
      password: bcrypt.hashSync(userDto.password, bcrypt.genSaltSync(10)),
    });
    if (!user) {
      throw new NotFoundException('Tạo User Thất bại');
    }
    return await this.customerService.saveCustomer(user?.id, {
      email: user?.email,
      phone: user?.phone,
      first_name: userDto?.first_name,
      last_name: userDto?.last_name,
    } as CustomersDto);
  }
  async requestResetPassword(email: string): Promise<{ newPassword: string }> {
    const user = await this.findOneUserWithEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const password = Math.random().toString(36).slice(-8);
    const salt = bcrypt.genSaltSync(10);
    user.password = await bcrypt.hash(password, salt);
    await this.userReposity.update({ id: user.id }, user);
    return { newPassword: password };
  }
  async updateRoles(
    username: string,
    roles: string,
    action: 'up' | 'down' = 'up',
  ): Promise<{ result: string }> {
    // Find the user based on the email
    const user = await this.userReposity.findOne({
      where: {
        username: username,
      },
    });

    // Define a list of valid roles
    const roleList = ['Moderator', 'Quản Lý', 'Nhân Viên'];

    // If the user is not found, throw an error
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find the index of the provided role in the roleList
    const roleIndex = roleList.findIndex((role) => role === roles);

    // If the provided role is not found, throw an error
    if (roleIndex === -1) {
      throw new NotFoundException('Không tìm thấy roles của user');
    }
    // If the user already has the highest/lowest role, throw an error
    if (action === 'up' && roleIndex === 0) {
      throw new NotFoundException('hiện tại đã là role cao nhất có thể nâng');
    }
    if (action === 'down' && roleIndex === roleList.length - 1) {
      throw new NotFoundException('hiện tại đã là role thấp nhất có thể giảm');
    }

    // Update the user's roles based on the action
    user.role = roleList[roleIndex + (action === 'up' ? -1 : 1)];

    // Save the updated user to the repository
    await this.userReposity.save(user);

    // Return a success message
    return { result: 'thành công' };
  }
  async createVerifyKey(email: string): Promise<{ result: string }> {
    const userFounded = await this.userReposity
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.verify', 'verifyKey')
      .leftJoinAndSelect('users.customer', 'customers')
      .where('users.email = :email', { email }) // Chỉ định rõ 'users.id'
      .getOne();
    if (!userFounded) {
      this.logger.error('Không tìm thấy user');
      throw new HttpException('Không tìm thấy user', HttpStatus.FORBIDDEN);
    }
    const secretKey = Math.floor(100000 + Math.random() * 900000);
    const verify = await this.verifyReposity.save({
      secretKey,
      activeKeyExpiresAt: new Date(new Date().getTime() + 5 * 60000),
    });
    if (!verify) {
      this.logger.error('Tạo verify key thất bại');
      throw new HttpException('Tạo verify key thất bại', HttpStatus.FORBIDDEN);
    }
    userFounded.verify = verify;
    await this.userReposity.update(userFounded.id, userFounded);
    await this.mailService.sendRequestVerifyEmail(
      verify.secretKey,
      userFounded.email,
      userFounded.customer?.last_name + userFounded.customer?.first_name,
    );
    return { result: 'tạo verifyKey thành công' };
  }
  async checkVerifyKey(
    key: number,
    email: string,
  ): Promise<{ result: string }> {
    const userFounded = await this.userReposity
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.verify', 'verifyKey')
      .where('users.email = :email', { email }) // Chỉ định rõ 'users.id'
      .getOne();

    if (!userFounded) {
      return { result: 'User không tồn tại' };
    }
    if (userFounded.verify.secretKey !== Number(key)) {
      return { result: 'Mã xác nhận không đúng!' };
    }
    const verify = userFounded.verify;
    if (
      userFounded.verify.activeKeyExpiresAt.getTime() <= new Date().getTime()
    ) {
      userFounded.verify = null;
      await this.userReposity.update(userFounded.id, userFounded);
      await this.verifyReposity.delete(verify.id);
      return { result: 'Mã xác nhận đã hết hạn.!' };
    }
    userFounded.verify = null;
    userFounded.isActive = true;
    await this.userReposity.update(userFounded.id, userFounded);
    await this.verifyReposity.delete(verify.id);
    return { result: 'thành công' };
  }
}

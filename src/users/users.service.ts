import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersDto } from './users.dto';
import { UserEntity } from './user.entity';
import { Repository } from 'typeorm';
import { MysqlBaseService } from 'src/common/mysql/base.service';
import { plainToClass, plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';
import { CustomersDto } from 'src/customers/customers.dto';

@Injectable()
export class UsersService extends MysqlBaseService<UserEntity, UsersDto> {
  constructor(
    // @Inject('STORE_SERVICEuser.json') private storeService: StoreService,
    @InjectRepository(UserEntity)
    private readonly userReposity: Repository<UserEntity>,
    private readonly mailService: MailService,
  ) {
    super(userReposity, UsersDto);
  }
  async findAll(
    query,
  ): Promise<{ users: Array<UsersDto>; usersCount: number }> {
    const qb = await this.userReposity
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.customer', 'customers');

    qb.where('1 = 1');

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
        return plainToClass(
          UsersDto,
          {
            ...user,
            customer,
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
      .leftJoinAndSelect('user.customer', 'customer')
      .getOne();

    return user || null;
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
}

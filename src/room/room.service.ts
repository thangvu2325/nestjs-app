import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { CreateRoomDto } from './dto/create-room.dto';
import { GetRoomsDto } from './dto/get-rooms.dto';
import { SearchRoomsDto } from './dto/search-rooms.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './room.entity';
import { plainToInstance } from 'class-transformer';
import { UsersDto } from 'src/users/users.dto';
import { UserEntity } from 'src/users/entity/user.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async getRooms(getRoomsDto: GetRoomsDto) {
    const roomList = await this.roomRepository.find({
      skip: getRoomsDto?.skip,
      take: getRoomsDto?.take,
      order: { createdAt: 'DESC' },
      relations: ['owner', 'messages'],
    });
    return roomList.map((room) => {
      return {
        ...room,
        owner: plainToInstance(UsersDto, room.owner, {
          excludeExtraneousValues: true,
        }),
      };
    });
  }

  async getRoom(id: string) {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['owner', 'messages', 'messages.owner', 'owner.customer'],
    });
    return {
      ...room,
      owner: room.owner ? room.owner.customer.customer_id : null,
      submiter: room?.submiter ? room?.submiter.email : null,
      messages: room?.messages?.sort((a, b) => {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      }),
    };
  }

  async searchRooms(searchRoomsDto: SearchRoomsDto) {
    const qb = this.roomRepository
      .createQueryBuilder('rooms')
      .leftJoinAndSelect('rooms.owner', 'owner')
      .leftJoinAndSelect('owner.customer', 'customer');
    if (searchRoomsDto.skip) {
      qb.skip(searchRoomsDto.skip);
    }
    if (searchRoomsDto.take) {
      qb.take(searchRoomsDto.take);
    }
    if (searchRoomsDto.title) {
      qb.andWhere('rooms.title ILIKE :title', {
        title: `%${searchRoomsDto.title}%`,
      });
    }
    if (searchRoomsDto.type) {
      qb.andWhere('rooms.type = :type', {
        type: searchRoomsDto.type,
      });
    }
    if (searchRoomsDto.status) {
      qb.andWhere('rooms.status = :status', {
        status: searchRoomsDto.status,
      });
    }
    if (searchRoomsDto.ownerId) {
      qb.andWhere('rooms.ownerId = :ownerId', {
        ownerId: searchRoomsDto.ownerId,
      });
    }
    const [items, count] = await qb.getManyAndCount();
    return {
      roomList: items.map((room) => {
        return {
          ...room,
          owner: room.owner ? room.owner.customer.customer_id : null,
          submiter: room?.submiter ? room?.submiter.email : null,
          messages: room?.messages?.sort((a, b) => {
            return (
              new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            );
          }),
        };
      }),
      count: count,
    };
  }

  async createRoom(createRoomDto: CreateRoomDto, userId: string) {
    const roomPartial: DeepPartial<Room> = {
      title: createRoomDto.title,
      description: createRoomDto.description,
      owner: { id: userId },
    };
    const room = this.roomRepository.create(roomPartial);
    await this.roomRepository.save(room);
    return room;
  }
  async updateRoom(id: string, updateRoomDto: UpdateRoomDto) {
    const roomFound = await this.roomRepository.findOne({
      where: { id },
      relations: ['owner', 'messages', 'messages.owner', 'owner.customer'],
    });

    if (!roomFound) {
      throw new HttpException('Room này không tồn tại!', HttpStatus.FORBIDDEN);
    }

    const { submiter, ...props } = updateRoomDto;

    if (submiter) {
      const user = await this.usersRepository.findOne({
        where: { id: submiter },
      });
      if (!user) {
        throw new HttpException(
          'Người dùng này không tồn tại',
          HttpStatus.FORBIDDEN,
        );
      }
      roomFound.submiter = user;
    }
    const updatedRoom = {
      ...roomFound,
      ...props,
    };

    const roomUpdated = await this.roomRepository.save(updatedRoom);
    return {
      ...roomUpdated,
      owner: roomUpdated.owner ? roomUpdated.owner.customer.customer_id : null,
      submiter: roomUpdated?.submiter ? roomUpdated?.submiter.email : null,
      messages: roomUpdated?.messages?.sort((a, b) => {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      }),
    };
  }
  async deleteRoom(id: string) {
    const result = await this.roomRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }
  }
}

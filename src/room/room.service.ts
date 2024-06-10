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
      relations: [
        'owner',
        'messages',
        'messages.owner',
        'owner.customer',
        'submiter',
      ],
    });
    return {
      ...room,
      owner: room.owner ? room.owner.customer.customer_id : null,
      submiter: room?.submiter ? room?.submiter.id : null,
      messages: room?.messages?.sort((a, b) => {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      }),
    };
  }

  async searchRooms(searchRoomsDto: SearchRoomsDto, submiter?: string) {
    const qb = this.roomRepository
      .createQueryBuilder('rooms')
      .leftJoinAndSelect('rooms.owner', 'roomOwner') // Renamed to 'roomOwner'
      .leftJoinAndSelect('rooms.messages', 'messages')
      .leftJoinAndSelect('messages.owner', 'messageOwner') // Renamed to 'messageOwner'
      .leftJoinAndSelect('rooms.submiter', 'submiter')
      .leftJoinAndSelect('roomOwner.customer', 'customer');

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
      roomList: searchRoomsDto.ownerId
        ? (() => {
            const room = items
              .filter((room) => room?.status !== 'RESOLVED')
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
            return [
              {
                ...room,
                owner: room?.owner?.customer?.customer_id || null,
                submiter: room?.submiter?.email || null,
                messages: room?.messages?.sort((a, b) => {
                  return (
                    new Date(a.updatedAt).getTime() -
                    new Date(b.updatedAt).getTime()
                  );
                }),
              },
            ];
          })()
        : items
            .filter((room) => {
              if (submiter) {
                return room.submiter.id === submiter;
              }
              return true;
            })
            .map((room) => {
              return {
                ...room,
                owner: room?.owner?.customer?.customer_id || null,
                submiter: room?.submiter?.id || null,
                messages: room?.messages?.sort((a, b) => {
                  return (
                    new Date(a.updatedAt).getTime() -
                    new Date(b.updatedAt).getTime()
                  );
                }),
              };
            }),
      count: searchRoomsDto.ownerId ? 1 : count,
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
    // Find the room by id, including related entities
    const roomFound = await this.roomRepository.findOne({
      where: { id },
      relations: ['owner', 'messages', 'messages.owner', 'owner.customer'],
    });

    // If the room is not found, throw an error
    if (!roomFound) {
      throw new HttpException('Room này không tồn tại!', HttpStatus.FORBIDDEN);
    }

    const { submiter, ...props } = updateRoomDto;

    // Update the room properties
    Object.assign(roomFound, props);

    // Handle submiter update if provided
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

      // Update the submiter and their room list
      roomFound.submiter = user;
      if (user.roomSubmited) {
        user.roomSubmited.push(roomFound);
      } else {
        user.roomSubmited = [roomFound];
      }
    }

    // Handle status update and related submiter cleanup
    if (props.status && props.status === 'PENDING') {
      if (roomFound.submiter) {
        roomFound.submiter.roomSubmited =
          roomFound.submiter.roomSubmited.filter(
            (room) => room.id !== roomFound.id,
          );
      }
      roomFound.submiter = null;
    }

    // Save the updated submiter entity if it exists
    if (roomFound.submiter) {
      await this.usersRepository.save(roomFound.submiter);
    }

    // Save the updated room entity
    await this.roomRepository.save(roomFound);

    // Sort messages by updatedAt
    const sortedMessages = roomFound.messages.sort((a, b) => {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    });

    // Return the updated room details
    return {
      ...roomFound,
      owner: roomFound.owner ? roomFound.owner.customer.customer_id : null,
      submiter: roomFound.submiter ? roomFound.submiter.id : null,
      messages: sortedMessages,
    };
  }

  async deleteRoom(id: string) {
    const result = await this.roomRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }
  }
}

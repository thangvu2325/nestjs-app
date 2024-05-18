import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { CreateRoomDto } from './dto/create-room.dto';
import { GetRoomsDto } from './dto/get-rooms.dto';
import { SearchRoomsDto } from './dto/search-rooms.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './room.entity';
import { plainToInstance } from 'class-transformer';
import { UsersDto } from 'src/users/users.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
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
      relations: ['owner', 'messages', 'messages.owner'],
    });
    return {
      ...room,
      owner: plainToInstance(UsersDto, room.owner, {
        excludeExtraneousValues: true,
      }),
      messages: room?.messages?.sort((a, b) => {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      }),
    };
  }

  async searchRooms(searchRoomsDto: SearchRoomsDto) {
    const qb = this.roomRepository.createQueryBuilder('rooms');
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
    if (searchRoomsDto.ownerId) {
      qb.andWhere('rooms.ownerId = :ownerId', {
        ownerId: searchRoomsDto.ownerId,
      });
    }
    const [items, count] = await qb.getManyAndCount();
    return { items, count };
  }

  async createRoom(
    createRoomDto: CreateRoomDto,
    userId: string,
  ): Promise<{ result: string }> {
    const roomPartial: DeepPartial<Room> = {
      title: createRoomDto.title,
      description: createRoomDto.description,
      owner: { id: userId },
    };
    const room = this.roomRepository.create(roomPartial);
    await this.roomRepository.save(room);
    return { result: 'thành công' };
  }
  async updateRoom(id: string, updateRoomDto: UpdateRoomDto, userId: string) {
    const result = await this.roomRepository.update(id, {
      ...updateRoomDto,
      owner: { id: userId },
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }
  }

  async deleteRoom(id: string) {
    const result = await this.roomRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }
  }
}

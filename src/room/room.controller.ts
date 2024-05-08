import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomService } from './room.service';
import { GetRoomsDto } from './dto/get-rooms.dto';
import { SearchRoomsDto } from './dto/search-rooms.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Controller('rooms')
@UseGuards(JwtGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  getRooms(getRoomsDto: GetRoomsDto) {
    return this.roomService.getRooms(getRoomsDto);
  }

  @Get(':id')
  getRoom(@Param('id', ParseIntPipe) id: number) {
    return this.roomService.getRoom(id);
  }

  @Get('search')
  searchRooms(@Query() searchRoomsDto: SearchRoomsDto) {
    return this.roomService.searchRooms(searchRoomsDto);
  }

  @Post()
  createRoom(
    @Body() data: { userId: string },
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return this.roomService.createRoom(createRoomDto, data.userId);
  }

  @Put(':id')
  updateRoom(
    @Body() data: { userId: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomService.updateRoom(id, updateRoomDto, data.userId);
  }

  @Delete(':id')
  deleteRoom(
    @Body() data: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.roomService.deleteRoom(id);
  }
}

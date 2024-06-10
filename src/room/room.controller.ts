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
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomService } from './room.service';
import { GetRoomsDto } from './dto/get-rooms.dto';
import { SearchRoomsDto } from './dto/search-rooms.dto';
import { ModGuard } from 'src/auth/guards/mod.guard';

@Controller('rooms')
// @UseGuards(JwtGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  getRooms(_getRoomsDto: GetRoomsDto) {
    console.log(_getRoomsDto);
    return this.roomService.getRooms({ skip: 0, take: 10 });
  }
  @Get('search')
  searchRooms(@Query() searchRoomsDto: SearchRoomsDto) {
    return this.roomService.searchRooms(searchRoomsDto);
  }
  @UseGuards(ModGuard)
  @Get('submiter')
  searchRoomsSubmitner(
    @Query() searchRoomsDto: SearchRoomsDto,
    @Request() req,
  ) {
    return this.roomService.searchRooms(searchRoomsDto, req.user.id);
  }
  @Get(':id')
  getRoom(@Param('id') id: string) {
    return this.roomService.getRoom(id);
  }

  @Post()
  createRoom(
    @Body() data: { userId: string },
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return this.roomService.createRoom(createRoomDto, data.userId);
  }

  @Put(':id')
  updateRoom(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomService.updateRoom(id, updateRoomDto);
  }
  @Delete(':id')
  deleteRoom(
    @Body() data: { userId: string },
    @Param('id', ParseIntPipe) id: string,
  ) {
    return this.roomService.deleteRoom(id);
  }
}

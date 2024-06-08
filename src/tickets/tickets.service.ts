import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { UserEntity } from 'src/users/entity/user.entity';
import { CreateTicketDto } from './dto/create-tickets.dto';
import { TicketDto } from './dto/tickets.dto';
import { ticketsEntity } from './entity/tickets.entity';
import { ticketMessageEntity } from './entity/ticket-message.entity';
import { EditTicketDto } from './dto/edit-tickets.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(ticketsEntity)
    private readonly ticketsRepository: Repository<ticketsEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ticketMessageEntity)
    private readonly ticketMessageRepository: Repository<ticketMessageEntity>,
  ) {}
  async Get(query: {
    startDate?: string;
    endDate?: string;
    status?: string;
    userId?: string;
    tickedId?: string;
  }): Promise<{ ticketsList: Array<TicketDto>; ticketsCount: number }> {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(new Date().setDate(new Date().getDate() - 10));
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    if (
      (startDate && isNaN(startDate.getTime())) ||
      (endDate && isNaN(endDate.getTime()))
    ) {
      throw new Error('Invalid date format');
    }
    const qb = await this.ticketsRepository
      .createQueryBuilder('tickets')
      .leftJoinAndSelect('tickets.owner', 'owner')
      .leftJoinAndSelect('tickets.reply', 'reply')
      .leftJoinAndSelect('owner.customer', 'customers')
      .leftJoinAndSelect('tickets.submiter', 'submiter')

      .where('tickets.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (query.status) {
      qb.andWhere('tickets.status = :status', {
        status: query.status,
      });
    }

    const ticketsList = await qb.getMany();
    const ticketsDtoArray = ticketsList
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .filter((ticket) => {
        if (query.tickedId) {
          console.log(ticket.id, query.tickedId);
          return ticket.id === query.tickedId;
        }
        return true;
      })
      .filter((ticket) => {
        if (query.userId) {
          return ticket.owner.id === query.userId;
        }
        return true;
      })
      .map((tickets) => {
        return {
          ...plainToInstance(
            TicketDto,
            {
              ...tickets,
              customer_Id: tickets?.owner?.customer?.customer_id,
              submiter: tickets.submiter ? tickets.submiter.email : null,
              message: tickets.reply ? tickets.reply.message : null,
            },
            { excludeExtraneousValues: true },
          ),
        };
      });

    return {
      ticketsList: ticketsDtoArray,
      ticketsCount: ticketsList.length,
    };
  }
  async createTicket(userId: string, Dto: CreateTicketDto) {
    const userFound = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['ticket'],
    });
    if (!userFound) {
      throw new HttpException('User này không tồn tại!', HttpStatus.FORBIDDEN);
    }
    const ticket = await this.ticketsRepository.create(Dto);
    ticket.owner = userFound;
    await this.ticketsRepository.save(ticket as ticketsEntity);
    if (!userFound.ticket) {
      userFound.ticket = [];
    }
    userFound.ticket.push(ticket);
    await this.usersRepository.save(userFound);

    return plainToInstance(TicketDto, ticket, {
      excludeExtraneousValues: true,
    });
  }
  async updateTicket(ticketId: string, Dto: EditTicketDto) {
    const ticketFound = await this.ticketsRepository.findOne({
      where: { id: ticketId },
      relations: ['reply', 'submiter'],
    });

    if (!ticketFound) {
      throw new HttpException(
        'Ticket này không tồn tại!',
        HttpStatus.FORBIDDEN,
      );
    }

    const { message, submiter, ...props } = Dto;

    if (message) {
      if (ticketFound.reply?.id) {
        await this.ticketMessageRepository.update(ticketFound.reply.id, {
          ...ticketFound.reply,
          message: Dto.message,
        });
      } else {
        const newTicketMessage = await this.ticketMessageRepository.save({
          ...ticketFound.reply,
          message: Dto.message,
        });
        ticketFound.reply = newTicketMessage;
      }
    }

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
      ticketFound.submiter = user;
    }

    const updatedTicket = {
      ...ticketFound,
      ...props,
    };
    console.log(ticketFound);
    const ticketUpdated = await this.ticketsRepository.save(updatedTicket);
    console.log(ticketUpdated);
    return plainToInstance(
      TicketDto,
      {
        ...ticketUpdated,
        customer_Id: ticketUpdated?.owner?.customer?.customer_id,
        submiter: ticketUpdated.submiter ? ticketUpdated.submiter.email : null,
        message: ticketUpdated.reply ? ticketUpdated.reply.message : null,
      },
      { excludeExtraneousValues: true },
    );
  }
}

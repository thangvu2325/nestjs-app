import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtGuard } from './jwt.guard';
@Injectable()
export class AdminGuard extends JwtGuard {
  constructor(jwtService: JwtService) {
    super(jwtService, 'Administrator');
  }
}

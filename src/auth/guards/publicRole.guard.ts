import { Injectable } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PublicGuard extends JwtGuard {
  constructor(jwtService: JwtService) {
    super(jwtService); // Không cung cấp requiredRole
  }
}

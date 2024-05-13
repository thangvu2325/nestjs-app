import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
export type RedisClient = Redis;

export const redisProvider: Provider = {
  useFactory: (): RedisClient => {
    return new Redis({
      host: 'localhost',
      port: 6379,
      password: 'eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81',
    });
  },
  provide: 'REDIS_CLIENT',
};

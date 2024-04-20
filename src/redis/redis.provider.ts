import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
export type RedisClient = Redis;

export const redisProvider: Provider = {
  useFactory: (): RedisClient => {
    return new Redis(process.env.redisURI);
  },
  provide: 'REDIS_CLIENT',
};

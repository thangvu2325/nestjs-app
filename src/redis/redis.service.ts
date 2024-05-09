import { Injectable, Inject } from '@nestjs/common';
import { RedisClient } from './redis.provider';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly client: RedisClient) {}

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const key = `RF_TOKEN:${userId}`;
    60 * 60 * 24 * 7;
    await this.set({ key, value: token, expired: 60 * 60 * 24 * 7 });
  }
  set(redisData: {
    key: string;
    value: string;
    expired: string | number;
  }): Promise<'OK'> {
    const { key, value, expired } = redisData;
    return this.client.set(key, value, 'EX', expired);
  }
  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }
  async isRefreshTokenValid(userId: string): Promise<boolean> {
    const refreshToken = await this.getRefreshToken(userId);
    return !!refreshToken;
  }
  async getRefreshToken(userId: string) {
    const key = `RF_TOKEN:${userId}`;
    const getRfToken = await this.get(key);
    return getRfToken;
  }
  async del(key: string) {
    return this.client.del(key);
  }

  async delRFToken(sub: string) {
    const key = `RF_TOKEN:${sub}`;
    return this.client.del(key);
  }
  async getAllTokens(): Promise<string[]> {
    const keys = await this.client.keys('*'); // Get all keys (tokens) in Redis

    // Filter out null values (expired or non-existing tokens)
    const validTokens = keys.filter((token) => token !== null);

    return validTokens as string[];
  }
  async deleteAllTokens(): Promise<{ result: string }> {
    const keys = await this.client.keys('*');

    if (keys.length === 0) {
      return;
    }

    await this.client.del(...keys);
    return { result: 'Đã xóa tất cả Token' };
  }
}

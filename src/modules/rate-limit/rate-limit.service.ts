import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitService {
  constructor(private redisService: RedisService) {}

  async isAllowed(key: string, limit: number, windowSec: number) {
    const redis = this.redisService.getClient();

    const now = Date.now();
    const windowStart = now - windowSec * 1000;

    const redisKey = `rate:${key}`;

    await redis.zadd(redisKey, now, `${now}`);
    await redis.zremrangebyscore(redisKey, 0, windowStart);

    const count = await redis.zcard(redisKey);

    await redis.expire(redisKey, windowSec);

    return {
      allowed: count <= limit,
      count,
      limit,
    };
  }
}
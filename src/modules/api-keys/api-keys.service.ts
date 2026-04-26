import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) { }

  async create(createApiKeyDto: CreateApiKeyDto, userId: string) {
    const { name, limit, windowSec } = createApiKeyDto;

    const rawKey = `rl_${randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashKey(rawKey);
    const prefix = rawKey.substring(0, 7);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        key: hashedKey,
        name,
        prefix,
        userId,
        limit: limit ?? 100,
        windowSec: windowSec ?? 60,
      },
    });

    return {
      ...apiKey,
      rawKey,
    };
  }

  async findAllByUser(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.apiKey.findFirst({
      where: { id, userId },
    });
  }

  async update(id: string, userId: string, updateApiKeyDto: UpdateApiKeyDto) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    const updated = await this.prisma.apiKey.update({
      where: { id },
      data: updateApiKeyDto,
    });

    const redis = this.redisService.getClient();
    await redis.del(`config:apikey:${updated.key}`);

    return updated;
  }

  async remove(id: string, userId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    await this.prisma.apiKey.delete({
      where: { id },
    });

    const redis = this.redisService.getClient();
    await redis.del(`config:apikey:${apiKey.key}`);

    return { deleted: true };
  }

  async validateKey(rawKey: string) {
    const hashedKey = this.hashKey(rawKey);
    const redis = this.redisService.getClient();
    const cacheKey = `config:apikey:${hashedKey}`;

    const cachedConfig = await redis.get(cacheKey);
    if (cachedConfig) {
      const apiKey = JSON.parse(cachedConfig);

      this.updateLastUsed(apiKey.id);

      return apiKey;
    }

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key: hashedKey, isActive: true },
    });

    if (!apiKey) {
      return null;
    }

    await redis.set(cacheKey, JSON.stringify(apiKey), 'EX', 300);

    this.updateLastUsed(apiKey.id);

    return apiKey;
  }

  private updateLastUsed(apiKeyId: string) {
    this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    }).catch(err => console.error('Error updating lastUsedAt', err));
  }

  async logUsage(apiKeyId: string, status: number, endpoint: string, ip: string) {
    return this.prisma.usageLog.create({
      data: {
        apiKeyId,
        status,
        endpoint,
        ip,
      },
    }).catch(err => console.error('Error logging usage', err));
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}
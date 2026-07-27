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

  private readonly baseWhere = {
    deletedAt: null,
  };

  async create(createApiKeyDto: CreateApiKeyDto, userId: string) {
    const { name, limit, windowSec, expiresInDays } = createApiKeyDto;

    const rawKey = `rl_${randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashKey(rawKey);
    const prefix = rawKey.substring(0, 7);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = await this.prisma.apiKey.create({
      data: {
        key: hashedKey,
        name,
        prefix,
        userId,
        limit: limit ?? 100,
        windowSec: windowSec ?? 60,
        expiresAt,
      },
    });

    return {
      ...apiKey,
      rawKey,
    };
  }

  async findAllByUser(userId: string) {
    return this.prisma.apiKey.findMany({
      where: {
        userId,
        ...this.baseWhere,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.apiKey.findFirst({
      where: {
        id,
        userId,
        ...this.baseWhere,
      },
    });
  }

  async update(id: string, userId: string, updateApiKeyDto: UpdateApiKeyDto) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id,
        userId,
        ...this.baseWhere,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    const data: any = { ...updateApiKeyDto };

    if (updateApiKeyDto.expiresInDays !== undefined) {
      data.expiresAt = updateApiKeyDto.expiresInDays
        ? new Date(Date.now() + updateApiKeyDto.expiresInDays * 24 * 60 * 60 * 1000)
        : null;
      delete data.expiresInDays;
    }

    const updated = await this.prisma.apiKey.update({
      where: { id },
      data,
    });

    const redis = this.redisService.getClient();
    await redis.del(`config:apikey:${updated.key}`);

    return updated;
  }

  async remove(id: string, userId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id,
        userId,
        ...this.baseWhere,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    await this.prisma.apiKey.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
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

      if (apiKey.deletedAt || !apiKey.isActive) {
        await redis.del(cacheKey);
        return null;
      }

      if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
        await redis.del(cacheKey);
        return null;
      }

      this.updateLastUsed(apiKey.id);
      return apiKey;
    }

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key: hashedKey },
    });

    if (!apiKey || apiKey.deletedAt || !apiKey.isActive) {
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    await redis.set(cacheKey, JSON.stringify(apiKey), 'EX', 300);

    this.updateLastUsed(apiKey.id);

    return apiKey;
  }

  async logUsage(apiKeyId: string, status: number, endpoint: string, ip: string) {
    return this.prisma.usageLog.create({
      data: { apiKeyId, status, endpoint, ip },
    }).catch(err => console.error('Error logging usage', err));
  }

  private updateLastUsed(apiKeyId: string) {
    this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    }).catch(err => console.error('Error updating lastUsedAt', err));
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}

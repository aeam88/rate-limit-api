import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverallStats(userId: string) {
    const userKeys = await this.prisma.apiKey.findMany({
      where: { userId },
      select: { id: true },
    });

    const keyIds = userKeys.map(k => k.id);

    if (keyIds.length === 0) {
      return { totalRequests: 0, statusBreakdown: [], topEndpoints: [] };
    }

    const statusBreakdown = await this.prisma.usageLog.groupBy({
      by: ['status'],
      where: { apiKeyId: { in: keyIds } },
      _count: { _all: true },
    });

    const topEndpoints = await this.prisma.usageLog.groupBy({
      by: ['endpoint'],
      where: { apiKeyId: { in: keyIds } },
      _count: { _all: true },
      orderBy: { _count: { endpoint: 'desc' } },
      take: 5,
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usageHistory = await this.prisma.usageLog.findMany({
        where: {
            apiKeyId: { in: keyIds },
            createdAt: { gte: sevenDaysAgo }
        },
        select: {
            createdAt: true,
            status: true
        }
    });

    return {
      statusBreakdown: statusBreakdown.map(s => ({
        status: s.status,
        count: s._count._all,
      })),
      topEndpoints: topEndpoints.map(e => ({
        endpoint: e.endpoint,
        count: e._count._all,
      })),
      usageHistory,
    };
  }

  async getStatsByKey(apiKeyId: string, userId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
        where: { id: apiKeyId, userId }
    });

    if (!apiKey) {
        return null;
    }

    const stats = await this.prisma.usageLog.groupBy({
        by: ['status'],
        where: { apiKeyId },
        _count: { _all: true }
    });

    return {
        apiKeyName: apiKey.name,
        stats: stats.map(s => ({
            status: s.status,
            count: s._count._all
        }))
    };
  }

  async getLogs(userId: string, limit = 50) {
    const userKeys = await this.prisma.apiKey.findMany({
      where: { userId },
      select: { id: true },
    });

    const keyIds = userKeys.map(k => k.id);

    if (keyIds.length === 0) {
      return [];
    }

    return this.prisma.usageLog.findMany({
      where: { apiKeyId: { in: keyIds } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        apiKey: {
          select: {
            name: true,
            prefix: true
          }
        }
      }
    });
  }
}

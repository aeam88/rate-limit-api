import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private buildDateFilter(from?: string, to?: string): Prisma.UsageLogWhereInput | undefined {
    if (!from && !to) return undefined;

    const filter: Prisma.DateTimeFilter = {};
    if (from) filter.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) filter.lte = new Date(`${to}T23:59:59.999Z`);

    return { createdAt: filter };
  }

  private async getUserKeyIds(userId: string): Promise<string[]> {
    const userKeys = await this.prisma.apiKey.findMany({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    return userKeys.map(k => k.id);
  }

  async getOverallStats(userId: string, from?: string, to?: string) {
    const keyIds = await this.getUserKeyIds(userId);

    if (keyIds.length === 0) {
      return { totalRequests: 0, statusBreakdown: [], topEndpoints: [], usageHistory: [] };
    }

    const dateFilter = this.buildDateFilter(from, to);
    const baseWhere: Prisma.UsageLogWhereInput = {
      apiKeyId: { in: keyIds },
      ...(dateFilter && dateFilter),
    };

    const [statusBreakdown, topEndpoints, usageHistory] = await Promise.all([
      this.prisma.usageLog.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
      }),
      this.prisma.usageLog.groupBy({
        by: ['endpoint'],
        where: baseWhere,
        _count: { _all: true },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 10,
      }),
      this.prisma.usageLog.findMany({
        where: baseWhere,
        select: {
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
    ]);

    const totalRequests = statusBreakdown.reduce((sum, s) => sum + s._count._all, 0);

    return {
      totalRequests,
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

  async getStatsByKey(apiKeyId: string, userId: string, from?: string, to?: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: apiKeyId, userId, deletedAt: null },
    });

    if (!apiKey) {
      return null;
    }

    const dateFilter = this.buildDateFilter(from, to);
    const where: Prisma.UsageLogWhereInput = {
      apiKeyId,
      ...(dateFilter && dateFilter),
    };

    const [stats, totalRequests] = await Promise.all([
      this.prisma.usageLog.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.usageLog.count({ where }),
    ]);

    return {
      apiKeyName: apiKey.name,
      totalRequests,
      stats: stats.map(s => ({
        status: s.status,
        count: s._count._all,
      })),
    };
  }

  async getLogs(userId: string, limit = 20, cursor?: string, from?: string, to?: string) {
    const keyIds = await this.getUserKeyIds(userId);

    if (keyIds.length === 0) {
      return { data: [], nextCursor: null, meta: { total: 0, hasMore: false } };
    }

    const dateFilter = this.buildDateFilter(from, to);
    const where: Prisma.UsageLogWhereInput = {
      apiKeyId: { in: keyIds },
      ...(dateFilter && dateFilter),
      ...(cursor && {
        createdAt: {
          lt: (await this.prisma.usageLog.findUnique({ where: { id: cursor } }))?.createdAt,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.usageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        include: {
          apiKey: {
            select: {
              name: true,
              prefix: true,
            },
          },
        },
      }),
      this.prisma.usageLog.count({ where }),
    ]);

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      data: items,
      nextCursor,
      meta: {
        total,
        hasMore,
        limit,
      },
    };
  }
}

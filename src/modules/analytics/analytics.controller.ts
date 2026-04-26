import { Controller, Get, Param, UseGuards, NotFoundException, Query, ParseIntPipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(@GetUser('userId') userId: string) {
    return this.analyticsService.getOverallStats(userId);
  }

  @Get('key/:id')
  async getKeyStats(
    @Param('id') apiKeyId: string,
    @GetUser('userId') userId: string
  ) {
    const stats = await this.analyticsService.getStatsByKey(apiKeyId, userId);
    if (!stats) {
        throw new NotFoundException('API Key not found or access denied');
    }
    return stats;
  }

  @Get('logs')
  async getLogs(
    @GetUser('userId') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    return this.analyticsService.getLogs(userId, limit);
  }
}

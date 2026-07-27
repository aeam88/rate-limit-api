import { Controller, Get, Param, UseGuards, NotFoundException, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DateFilterDto } from './dto/query-params.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get overall analytics summary' })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-01-31' })
  async getSummary(
    @GetUser('userId') userId: string,
    @Query() query: DateFilterDto,
  ) {
    return this.analyticsService.getOverallStats(userId, query.from, query.to);
  }

  @Get('key/:id')
  @ApiOperation({ summary: 'Get analytics for a specific API key' })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-01-31' })
  async getKeyStats(
    @Param('id') apiKeyId: string,
    @GetUser('userId') userId: string,
    @Query() query: DateFilterDto,
  ) {
    const stats = await this.analyticsService.getStatsByKey(apiKeyId, userId, query.from, query.to);
    if (!stats) {
      throw new NotFoundException('API Key not found or access denied');
    }
    return stats;
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get usage logs with pagination and date filters' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'cursor', required: false, description: 'Cursor ID from previous page' })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-01-31' })
  async getLogs(
    @GetUser('userId') userId: string,
    @Query() query: DateFilterDto,
  ) {
    return this.analyticsService.getLogs(
      userId,
      query.limit,
      query.cursor,
      query.from,
      query.to,
    );
  }
}

import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

import { envValidationSchema } from './config/env-validation.config';
import { RedisModule } from './modules/redis/redis.module';
import { TestModule } from './modules/test/test.module';
import { RateLimitService } from './modules/rate-limit/rate-limit.service';
import { RateLimitModule } from './modules/rate-limit/rate-limit.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    RedisModule,
    TestModule,
    RateLimitModule,
    ApiKeysModule,
    UsersModule,
    AuthModule,
    AnalyticsModule,
    PrismaModule,
    HealthModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
  ],
  controllers: [AppController],
  providers: [AppService, RateLimitService],
})
export class AppModule {}

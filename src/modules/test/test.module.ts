import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [RateLimitModule, ApiKeysModule],
  controllers: [TestController]
})
export class TestModule {}

import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private rateLimitService: RateLimitService,
    private apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const apiKeyRaw = req.headers['x-api-key'];
    
    if (!apiKeyRaw) {
        throw new UnauthorizedException('API Key is required');
    }

    const apiKeyConfig = await this.apiKeysService.validateKey(apiKeyRaw);
    
    if (!apiKeyConfig) {
        throw new UnauthorizedException('Invalid API Key');
    }

    const result = await this.rateLimitService.isAllowed(
      `apikey:${apiKeyConfig.id}`,
      apiKeyConfig.limit,
      apiKeyConfig.windowSec,
    );

    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, result.limit - result.count));

    if (!result.allowed) {
      await this.apiKeysService.logUsage(
        apiKeyConfig.id,
        HttpStatus.TOO_MANY_REQUESTS,
        req.url,
        req.ip,
      );

      res.setHeader('Retry-After', apiKeyConfig.windowSec);
      throw new HttpException({
          message: 'Rate limit exceeded',
          retryAfter: apiKeyConfig.windowSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.apiKeysService.logUsage(
        apiKeyConfig.id,
        HttpStatus.OK,
        req.url,
        req.ip,
    );

    req['apiKey'] = apiKeyConfig;

    return true;
  }
}
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiTags, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Testing')
@ApiSecurity('x-api-key')
@Controller('test')
export class TestController {
    
    @Get()
    @UseGuards(RateLimitGuard)
    async test(@Req() req: any) {
        return {
            message: 'Si ves esto, no has superado el límite de tu API Key',
            apiKeyInfo: {
                id: req.apiKey.id,
                name: req.apiKey.name,
                limit: req.apiKey.limit,
                windowSec: req.apiKey.windowSec
            }
        };
    }
}

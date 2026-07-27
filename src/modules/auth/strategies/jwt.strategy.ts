import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', ''),
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const redis = this.redisService.getClient();
    const isBlacklisted = await redis.get(`blacklist:${payload.jti}`);

    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return { userId: payload.sub, email: payload.email };
  }
}

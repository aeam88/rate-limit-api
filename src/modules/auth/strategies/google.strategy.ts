import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { OAuthProfile } from '../interfaces/oauth-profile.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL', ''),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const oauthProfile: OAuthProfile = {
      provider: 'google',
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      name: profile.displayName || profile.name?.givenName || null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };

    done(null, oauthProfile);
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { OAuthProfile } from '../interfaces/oauth-profile.interface';

type VerifyCallback = (error: Error | null, user?: OAuthProfile) => void;

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID', ''),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL', ''),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email =
      profile.emails?.[0]?.value ?? (await this.fetchPrimaryEmail(accessToken));

    const oauthProfile: OAuthProfile = {
      provider: 'github',
      providerId: profile.id,
      email,
      name: profile.displayName || profile.username || null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };

    done(null, oauthProfile);
  }

  private async fetchPrimaryEmail(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'shield-api',
        },
      });

      if (!response.ok) return null;

      const emails = (await response.json()) as GithubEmail[];
      const primary =
        emails.find((entry) => entry.primary && entry.verified) ??
        emails.find((entry) => entry.verified);

      return primary?.email ?? null;
    } catch {
      return null;
    }
  }
}

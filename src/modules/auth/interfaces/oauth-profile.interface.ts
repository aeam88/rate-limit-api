export type OAuthProvider = 'google' | 'github';

export interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

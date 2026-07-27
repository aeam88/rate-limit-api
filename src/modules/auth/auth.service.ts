import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  private generateTokens(user: { id: string; email: string; name: string | null }) {
    const payload = { email: user.email, sub: user.id };
    const jti = uuidv4();

    const access_token = this.jwtService.sign(
      { ...payload, jti, type: 'access' },
      { expiresIn: '15m' },
    );

    const refresh_token = this.jwtService.sign(
      { ...payload, jti, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return { access_token, refresh_token };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    const tokens = this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      if (payload.type !== 'refresh') {
        throw new ForbiddenException('Invalid token type');
      }

      const redis = this.redisService.getClient();
      const isBlacklisted = await redis.get(`blacklist:${payload.jti}`);

      if (isBlacklisted) {
        throw new ForbiddenException('Token has been revoked');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await redis.set(`blacklist:${payload.jti}`, '1', 'EX', 7 * 24 * 60 * 60);

      const tokens = this.generateTokens(user);

      return tokens;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new ForbiddenException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, accessToken: string) {
    try {
      const payload = this.jwtService.verify(accessToken);
      const redis = this.redisService.getClient();

      const decoded = this.jwtService.decode(accessToken) as any;
      const exp = decoded?.exp;
      const now = Math.floor(Date.now() / 1000);
      const ttl = exp ? exp - now : 900;

      if (ttl > 0) {
        await redis.set(`blacklist:${payload.jti}`, '1', 'EX', ttl);
      }

      return { message: 'Logged out successfully' };
    } catch {
      return { message: 'Logged out successfully' };
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.updatePassword(userId, hashedPassword);

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    return this.usersService.findById(userId);
  }

  async updateProfile(userId: string, updateData: { name?: string; organization?: string }) {
    return this.usersService.updateProfile(userId, updateData);
  }
}

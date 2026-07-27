import { Controller, Post, Body, Get, UseGuards, Patch, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns access_token, refresh_token and user info' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Returns access_token, refresh_token and user info' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Returns new access_token and refresh_token' })
  @ApiResponse({ status: 403, description: 'Invalid or expired refresh token' })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout and invalidate current token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  logout(
    @GetUser('userId') userId: string,
    @Req() req: any,
  ) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || '';
    return this.authService.logout(userId, token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@GetUser('userId') userId: string) {
    return this.authService.getProfile(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateProfile(
    @GetUser('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, updateProfileDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  changePassword(
    @GetUser('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }
}

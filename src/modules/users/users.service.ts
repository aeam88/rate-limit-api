import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        organization: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createOAuthUser(data: {
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
    provider: string;
    providerAccountId: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name ?? undefined,
        avatarUrl: data.avatarUrl ?? undefined,
        accounts: {
          create: {
            provider: data.provider,
            providerAccountId: data.providerAccountId,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        organization: true,
      },
    });
  }

  async linkOAuthAccount(
    userId: string,
    provider: string,
    providerAccountId: string,
  ) {
    return this.prisma.account.upsert({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
      update: {},
      create: { userId, provider, providerAccountId },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        organization: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByIdWithPassword(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });
  }

  async updatePassword(id: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateProfile(
    id: string,
    updateData: { name?: string; organization?: string },
  ) {
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        organization: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

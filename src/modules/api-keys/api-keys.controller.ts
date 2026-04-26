import { Controller, Post, Body, Get, UseGuards, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(
    @Body() createApiKeyDto: CreateApiKeyDto,
    @GetUser('userId') userId: string
  ) {
    return this.apiKeysService.create(createApiKeyDto, userId);
  }

  @Get()
  findAllByUser(@GetUser('userId') userId: string) {
    return this.apiKeysService.findAllByUser(userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string
  ) {
    const apiKey = await this.apiKeysService.findOne(id, userId);
    if (!apiKey) {
        throw new NotFoundException('API Key not found');
    }
    return apiKey;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto
  ) {
    return this.apiKeysService.update(id, userId, updateApiKeyDto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser('userId') userId: string
  ) {
    return this.apiKeysService.remove(id, userId);
  }
}
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedAccountGuard } from '../auth/guards/verified-account.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUploadTargetDto } from './dto/create-upload-target.dto';
import { StorageService } from './storage.service';

@Controller('media')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Post('upload-target')
  async createUploadTarget(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createUploadTargetDto: CreateUploadTargetDto,
  ) {
    return this.storageService.createUploadTarget(user, createUploadTargetDto);
  }
}

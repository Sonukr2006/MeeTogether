import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedAccountGuard } from '../auth/guards/verified-account.guard';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getPublicUser(@Param('userId') userId: string) {
    return this.usersService.getPublicUserById(userId);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Patch('me/avatar')
  async updateAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateAvatarDto: UpdateAvatarDto,
  ) {
    return this.usersService.updateAvatar(user.sub, updateAvatarDto.avatar);
  }
}

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedAccountGuard } from '../auth/guards/verified-account.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateMessageDto } from './dto/create-message.dto';
import { DiscussionsService } from './discussions.service';

@Controller()
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Get('projects/:projectId/threads')
  async getThreadsForProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.getThreadsForProject(projectId, user.sub);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Get('threads/:threadId/messages')
  async getMessagesForThread(
    @Param('threadId') threadId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.getMessagesForThread(threadId, user.sub);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Post('threads/:threadId/messages')
  async createMessage(
    @Param('threadId') threadId: string,
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.createMessage(threadId, user.sub, createMessageDto);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Post('threads/:threadId/read')
  async markThreadRead(
    @Param('threadId') threadId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.markThreadRead(threadId, user.sub);
  }
}

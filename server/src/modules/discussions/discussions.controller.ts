import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateMessageDto } from './dto/create-message.dto';
import { DiscussionsService } from './discussions.service';

@Controller()
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Get('projects/:projectId/threads')
  async getThreadsForProject(@Param('projectId') projectId: string) {
    return this.discussionsService.getThreadsForProject(projectId);
  }

  @Get('threads/:threadId/messages')
  async getMessagesForThread(@Param('threadId') threadId: string) {
    return this.discussionsService.getMessagesForThread(threadId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('threads/:threadId/messages')
  async createMessage(
    @Param('threadId') threadId: string,
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.createMessage(threadId, user.sub, createMessageDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('threads/:threadId/read')
  async markThreadRead(
    @Param('threadId') threadId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discussionsService.markThreadRead(threadId, user.sub);
  }
}

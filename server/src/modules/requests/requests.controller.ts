import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedAccountGuard } from '../auth/guards/verified-account.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Get()
  async getRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.requestsService.getInboxForUser(user.sub);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Patch('read-all')
  async markAllRequestsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.requestsService.markAllReadForRecipient(user.sub);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Patch(':requestId/status')
  async updateRequestStatus(
    @Param('requestId') requestId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateRequestStatusDto: UpdateRequestStatusDto,
  ) {
    return this.requestsService.updateStatusForRecipient(
      requestId,
      user.sub,
      updateRequestStatusDto.status,
    );
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  async getRequests(@Query('username') username?: string) {
    return this.requestsService.getRequests(username);
  }
}

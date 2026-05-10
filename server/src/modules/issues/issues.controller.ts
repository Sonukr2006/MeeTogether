import { Controller, Get, Query } from '@nestjs/common';
import { IssuesService } from './issues.service';

@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  async getIssues(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ) {
    return this.issuesService.getIssues({ projectId, status });
  }
}

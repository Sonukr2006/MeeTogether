import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { IssuesService } from './issues.service';

@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getIssues(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query() query?: CursorPaginationDto,
  ) {
    return this.issuesService.getIssues({
      projectId,
      status,
      cursor: query?.cursor,
      limit: query?.limit,
    });
  }
}

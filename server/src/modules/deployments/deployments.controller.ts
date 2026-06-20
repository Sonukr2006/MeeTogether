import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { DeploymentsService } from './deployments.service';

@Controller('deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getDeployments(@Query() query: CursorPaginationDto) {
    return this.deploymentsService.getDeployments(query);
  }
}

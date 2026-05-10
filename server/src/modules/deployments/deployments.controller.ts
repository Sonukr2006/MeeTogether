import { Controller, Get } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';

@Controller('deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get()
  async getDeployments() {
    return this.deploymentsService.getDeployments();
  }
}

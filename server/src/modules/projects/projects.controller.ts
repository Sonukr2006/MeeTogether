import { Controller, Get, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects() {
    return this.projectsService.getProjects();
  }

  @Get(':projectId')
  async getProjectById(@Param('projectId') projectId: string) {
    return this.projectsService.getProjectById(projectId);
  }
}

import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { VerifiedAccountGuard } from "../auth/guards/verified-account.guard";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { SetLikeStateDto } from "../likes/dto/set-like-state.dto";
import { CreateProjectCommentDto } from "./dto/create-project-comment.dto";
import { CreateProjectDto } from "./dto/create-project.dto";
import { SetProjectSaveStateDto } from "./dto/set-project-save-state.dto";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects() {
    return this.projectsService.getProjects();
  }

  @Get(":projectId")
  async getProjectById(@Param("projectId") projectId: string) {
    return this.projectsService.getProjectById(projectId);
  }

  @Get(":projectId/comments")
  async getComments(@Param("projectId") projectId: string) {
    return this.projectsService.getComments(projectId);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Post()
  async createProject(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.createProject(user.sub, createProjectDto);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Post(":projectId/like")
  async setLikeState(
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
    @Body() setLikeStateDto: SetLikeStateDto,
  ) {
    return this.projectsService.setLikeState(
      projectId,
      user.sub,
      setLikeStateDto.liked,
    );
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Post(":projectId/save")
  async setSaveState(
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
    @Body() setProjectSaveStateDto: SetProjectSaveStateDto,
  ) {
    return this.projectsService.setSaveState(
      projectId,
      user.sub,
      setProjectSaveStateDto.saved,
    );
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Post(":projectId/comments")
  async createComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("projectId") projectId: string,
    @Body() createProjectCommentDto: CreateProjectCommentDto,
  ) {
    return this.projectsService.createComment(
      projectId,
      user.sub,
      createProjectCommentDto.message,
    );
  }
}

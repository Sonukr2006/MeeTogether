import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { SetLikeStateDto } from '../likes/dto/set-like-state.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getFeedPosts() {
    return this.postsService.getFeedPosts();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.createPost(user.sub, createPostDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postId/like')
  async setLikeState(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
    @Body() setLikeStateDto: SetLikeStateDto,
  ) {
    return this.postsService.setLikeState(postId, user.sub, setLikeStateDto.liked);
  }
}

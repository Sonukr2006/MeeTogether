import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifiedAccountGuard } from '../auth/guards/verified-account.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { SetLikeStateDto } from '../likes/dto/set-like-state.dto';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async getFeedPosts(@Query() query: CursorPaginationDto) {
    return this.postsService.getFeedPosts(query);
  }

  @Get(':postId/comments')
  async getComments(
    @Param('postId') postId: string,
    @Query() query: CursorPaginationDto,
  ) {
    return this.postsService.getComments(postId, query);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Post()
  async createPost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.createPost(user.sub, createPostDto);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Post(':postId/like')
  async setLikeState(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
    @Body() setLikeStateDto: SetLikeStateDto,
  ) {
    return this.postsService.setLikeState(postId, user.sub, setLikeStateDto.liked);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Post(':postId/comments')
  async createComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
    @Body() createPostCommentDto: CreatePostCommentDto,
  ) {
    return this.postsService.createComment(postId, user.sub, createPostCommentDto.message);
  }
}

import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';

@Module({
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}

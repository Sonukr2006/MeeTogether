import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { VerifiedAccountGuard } from "../auth/guards/verified-account.guard";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateProofProfileDto } from "./dto/update-proof-profile.dto";
import { ProfilesService } from "./profiles.service";

@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get(":username")
  async getProfileByUsername(
    @Param("username") username: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.profilesService.getProfileByUsername(username, user?.sub);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Patch("me")
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(user.sub, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard, VerifiedAccountGuard)
  @Patch("me/proof")
  async updateMyProofProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateProofProfileDto: UpdateProofProfileDto,
  ) {
    return this.profilesService.updateProofProfile(
      user.sub,
      updateProofProfileDto,
    );
  }
}

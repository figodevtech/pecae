import { Controller, Get, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ModerationFiltersDto } from './dto/moderation-filters.dto';
import { ApproveListingDto } from './dto/approve-listing.dto';
import { RejectListingDto } from './dto/reject-listing.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '../auth/guards/policies.guard';
import { CheckPolicies } from '../auth/decorators/check-policies.decorator';
import { Action } from '../auth/casl/action.enum';
import { AppAbility } from '../auth/casl/casl-ability.factory';

@Controller('moderation')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // --- Listings Moderation ---

  @Get('listings')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, 'Listing'))
  async findAllListings(@Query() filters: ModerationFiltersDto) {
    return this.moderationService.findAllPendingListings(filters);
  }

  @Get('listings/:id')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, 'Listing'))
  async findOneListing(@Param('id') id: string) {
    return this.moderationService.findOneListing(id);
  }

  @Post('listings/:id/approve')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Approve, 'Listing'))
  async approveListing(@Param('id') id: string, @Body() dto: ApproveListingDto, @Request() req) {
    return this.moderationService.approveListing(id, dto, req.user);
  }

  @Post('listings/:id/reject')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Reject, 'Listing'))
  async rejectListing(@Param('id') id: string, @Body() dto: RejectListingDto, @Request() req) {
    return this.moderationService.rejectListing(id, dto, req.user);
  }

  // --- Document Verifications (Selo Verificado) ---

  @Get('verifications')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, 'SellerVerification'))
  async findAllVerifications() {
    return this.moderationService.findAllPendingVerifications();
  }

  @Post('verifications/:id/approve')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Approve, 'SellerVerification'))
  async approveVerification(@Param('id') id: string, @Request() req) {
    return this.moderationService.approveVerification(id, req.user);
  }

  @Post('verifications/:id/reject')
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Reject, 'SellerVerification'))
  async rejectVerification(@Param('id') id: string, @Body() dto: RejectVerificationDto, @Request() req) {
    return this.moderationService.rejectVerification(id, dto, req.user);
  }
}

import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { UserType } from '@prisma/client';
import { Action } from './action.enum';

export type Subjects = 'all' | 'Listing' | 'SellerVerification' | 'User';
export type AppAbility = MongoAbility<[Action, Subjects]>;

export interface UserPayload {
  id: string;
  email: string;
  type: UserType;
}

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: UserPayload) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.type === UserType.ADMIN) {
      can(Action.Manage, 'all');
    } else if (user.type === UserType.MODERATOR) {
      can(Action.Read, 'all');
      
      // Moderator permissions
      can(Action.Approve, 'Listing');
      can(Action.Reject, 'Listing');
      can(Action.Approve, 'SellerVerification');
      can(Action.Reject, 'SellerVerification');
      
      // Cannot moderate own listings (Conflict of interest)
      cannot(Action.Approve, 'Listing', { 'sellerProfile.userId': user.id });
      cannot(Action.Reject, 'Listing', { 'sellerProfile.userId': user.id });
    } else {
      // Regular users (BUYER, SELLER, BOTH)
      can(Action.Read, 'Listing', { status: 'PUBLISHED' });
      can(Action.Create, 'Listing');
      can(Action.Update, 'Listing');
      can(Action.Delete, 'Listing');
    }

    return build();
  }
}

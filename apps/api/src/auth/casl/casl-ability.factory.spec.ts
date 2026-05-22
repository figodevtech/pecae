import { CaslAbilityFactory } from './casl-ability.factory';
import { Action } from './action.enum';
import { UserType } from '@prisma/client';
import { subject } from '@casl/ability';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;

  beforeEach(() => {
    factory = new CaslAbilityFactory();
  });

  describe('[CASL-U-01] MODERATOR capabilities', () => {
    it('should allow MODERATOR to Approve or Reject a generic Listing', () => {
      const user = { id: 'mod-1', email: 'mod@pecae.com', type: UserType.MODERATOR };
      const ability = factory.createForUser(user);

      expect(ability.can(Action.Approve, 'Listing')).toBe(true);
      expect(ability.can(Action.Reject, 'Listing')).toBe(true);
    });
  });

  describe('[CASL-U-02] MODERATOR conflict of interest', () => {
    it('should NOT allow MODERATOR to Approve or Reject their own Listing', () => {
      const user = { id: 'mod-1', email: 'mod@pecae.com', type: UserType.MODERATOR };
      const ability = factory.createForUser(user);

      const ownListing = subject('Listing', {
        id: 'listing-1',
        sellerProfile: { userId: 'mod-1' }
      } as any);

      expect(ability.can(Action.Approve, ownListing)).toBe(false);
      expect(ability.can(Action.Reject, ownListing)).toBe(false);
    });

    it('should allow MODERATOR to Approve or Reject someone else\'s Listing', () => {
      const user = { id: 'mod-1', email: 'mod@pecae.com', type: UserType.MODERATOR };
      const ability = factory.createForUser(user);

      const otherListing = subject('Listing', {
        id: 'listing-2',
        sellerProfile: { userId: 'seller-x' }
      } as any);

      expect(ability.can(Action.Approve, otherListing)).toBe(true);
      expect(ability.can(Action.Reject, otherListing)).toBe(true);
    });
  });

  describe('ADMIN capabilities', () => {
    it('should allow ADMIN to manage all', () => {
      const user = { id: 'admin-1', email: 'admin@pecae.com', type: UserType.ADMIN };
      const ability = factory.createForUser(user);

      expect(ability.can(Action.Manage, 'all')).toBe(true);
    });
  });
});

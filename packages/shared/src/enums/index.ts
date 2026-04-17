/**
 * User account types in the PECAÊ platform.
 * A user can be a buyer, seller, or both.
 */
export enum UserType {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  BOTH = 'BOTH',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

/**
 * User account lifecycle statuses.
 */
export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

/**
 * OAuth providers supported by PECAÊ.
 */
export enum AuthProvider {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
  PHONE = 'PHONE',
}

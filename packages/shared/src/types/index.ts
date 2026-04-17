/**
 * Base user shape returned by the API (no sensitive fields).
 */
export interface UserPublic {
  id: string;
  name: string;
  email: string;
  type: import('../enums').UserType;
  status: import('../enums').UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  phone?: string | null;
  avatar?: string | null;
  createdAt: string;
}

/**
 * Auth tokens returned after login/register.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Standard API error response shape.
 */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

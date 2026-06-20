export type AuthenticatedUser = {
  sub: string;
  sid?: string;
  username: string;
  email: string;
  emailVerified: boolean;
};

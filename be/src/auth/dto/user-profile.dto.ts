export class UserProfileDto {
  id: string;
  email: string;
  createdAt: string;
  emailChangeLimitReached: boolean;
  emailChangeLimitResetAt: string | null;
}

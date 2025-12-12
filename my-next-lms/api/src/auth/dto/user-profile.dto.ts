export class UserProfileDto {
  id: string;
  email: string;
  createdAt: string;
  role: string;
  emailChangeLimitReached: boolean;
  emailChangeLimitResetAt: string | null;
}

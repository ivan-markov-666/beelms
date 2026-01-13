export class AuthTokenDto {
  accessToken?: string;
  tokenType?: string;

  twoFactorRequired?: boolean;
  challengeToken?: string;
}

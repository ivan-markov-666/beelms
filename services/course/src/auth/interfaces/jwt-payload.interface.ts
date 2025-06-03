export interface JwtPayload {
  userId: number;
  email: string;
  roles: string[];
  // Add any other user properties you need in the JWT payload
}

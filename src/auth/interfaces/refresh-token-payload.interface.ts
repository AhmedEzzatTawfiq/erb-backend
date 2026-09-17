export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  iat: number;
  exp: number;
}
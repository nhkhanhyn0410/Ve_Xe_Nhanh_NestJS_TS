export interface JwtPayload {
  sub: string; // user id
  fullname: string;
  email: string;
  iat?: number;
  exp?: number;
}

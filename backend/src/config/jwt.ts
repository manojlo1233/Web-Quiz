import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const ACCESS_SECRET: Secret  = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_EXPIRES  = (process.env.ACCESS_EXPIRES_IN  || '15m') as SignOptions['expiresIn'];
const REFRESH_EXPIRES = (process.env.REFRESH_EXPIRES_IN || '30d') as SignOptions['expiresIn'];

export type AppJwtPayload = { sub: string; role?: string; [k: string]: any };

export function signAccessToken(payload: Omit<AppJwtPayload, 'iat' | 'exp'>) {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES };
  return jwt.sign(payload, ACCESS_SECRET, options);
}

export function signRefreshToken(payload: Omit<AppJwtPayload, 'iat' | 'exp'>) {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

export function verifyAccess(token: string): AppJwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as AppJwtPayload;
}

export function verifyRefresh(token: string): AppJwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as AppJwtPayload;
}
import type { Request, Response, NextFunction } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config.js';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const secretKey = new TextEncoder().encode(config.jwtSecret);

export async function signToken(payload: AuthUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.jwtExpiry)
    .sign(secretKey);
}

export async function verifyToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, secretKey);
  return payload as unknown as AuthUser;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.auth_token || req.headers.authorization?.slice(7);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  verifyToken(token).then(
    (user) => { req.user = user; next(); },
    () => { res.status(401).json({ error: 'Invalid or expired token' }); }
  );
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (req.user.role !== role && req.user.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.auth_token || req.headers.authorization?.slice(7);
  if (!token) {
    next();
    return;
  }
  verifyToken(token)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch(() => next());
}

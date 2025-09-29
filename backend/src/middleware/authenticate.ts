import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../config/jwt';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role?: string };
}

export function authenticate(req: Request, res, next: NextFunction) {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccess(token);
    (req as AuthenticatedRequest).user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
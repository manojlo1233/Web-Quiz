import { Request, Response, NextFunction } from 'express';
import { userSessions } from '../websockets/matchmaking.ws';

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Missing or invalid Authorization header' });
        return;
    }

    const token = authHeader.replace('Bearer ', '');

    let matchedUserId: string | null = null;
    for (const [userId, sessionToken] of userSessions.entries()) {
        if (sessionToken === token) {
            matchedUserId = userId;
            break;
        }
    }

    if (!matchedUserId) {
        res.status(401).json({ message: 'Invalid or expired session token' });
        return;
    }

    (req as AuthenticatedRequest).userId = matchedUserId;
    next();
};
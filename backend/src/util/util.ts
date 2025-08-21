import crypto from 'crypto';
import { userSessions } from '../websockets/matchmaking.ws';



export function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function findUserIdByToken(token: string): string | null {
  for (const [userId, sessionToken] of userSessions.entries()) {
    if (sessionToken === token) {
      return userId;
    }
  }
  return null;
}

export function clearIntervalFromMap(map: Map<string, NodeJS.Timeout>, key: string) {
    if (map.has(key)) {
        clearInterval(map.get(key));
    }
}


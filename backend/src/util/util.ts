import path from "path";
import fs from 'fs'

export function clearIntervalFromMap(map: Map<string, NodeJS.Timeout>, key: string) {
    if (map.has(key)) {
        clearInterval(map.get(key));
    }
}

export function getAvailableAvatarsUtil(): string[] {
    const avatarsPath = path.join(__dirname, '../public/avatars');
    return fs.readdirSync(avatarsPath).filter(f => f.endsWith('.png'));
}
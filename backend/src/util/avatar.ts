import path from "path";
import fs from 'fs'

export function getAvailableAvatarsUtil(): string[] {
    const avatarsPath = path.join(__dirname, '../public/avatars');
    return fs.readdirSync(avatarsPath).filter(f => f.endsWith('.png'));
}

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Match } from '../models/Match';

const waitingList: WebSocket[] = [];
const activeMatches: Map<string, Match> = new Map();

export default function initWebSocketServer(server: Server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        ws.on('message', (message) => {
            const data = JSON.parse(message.toString());
            if (data.type === 'join-queue') {
                if (waitingList.filter(ws => (ws as any).username === data.username).length !== 0) { // Avoid adding same players to waitinList
                    return;
                }
                (ws as any).username = data.username;
                waitingList.push(ws);

                if (waitingList.length >= 2) {
                    const p1 = waitingList.shift()!;
                    const p2 = waitingList.shift()!;

                    const matchId = Math.random().toString(36).substring(2, 10);

                    let match: Match = new Match(matchId, p1, p2, (p1 as any).username, (p2 as any).username);
                    match.status = 'ready';

                    activeMatches.set(matchId, match);

                    p1.send(JSON.stringify({ type: 'MATCH_FOUND', opponent: (p2 as any).username, matchId, role: 'player1', startTimestamp: match.startTimestamp }));
                    p2.send(JSON.stringify({ type: 'MATCH_FOUND', opponent: (p1 as any).username, matchId, role: 'player2', startTimestamp: match.startTimestamp }));
                }
            }
            else if (data.type === 'READY') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                
                if (data.username === match.username1) match.readyP1 = true;
                if (data.username === match.username2) match.readyP2 = true;
                if (match.readyP1 && match.readyP2 && match.status === 'ready') {
                    match.status = 'started';
                    activeMatches.delete(data.matchId);

                    const payload = JSON.stringify({ type: 'MATCH_START', matchId: match.matchId })
                    match.player1.send(payload);
                    match.player2.send(payload);
                }
            }
            else if (data.type === 'DECLINE') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                match.status = 'cancelled';
                activeMatches.delete(match.matchId);
                const payload = JSON.stringify({ type: 'MATCH_DECLINED' })
                match.player1.send(payload);
                match.player2.send(payload);
            }
        });

        ws.on('close', () => {
            const index = waitingList.indexOf(ws);
            if (index !== -1) waitingList.splice(index, 1);
        });
    });
}
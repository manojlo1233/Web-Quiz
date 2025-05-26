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

                    let match: Match = new Match();
                    match.matchId = matchId
                    match.player1 = p1;
                    match.player2 = p2;
                    match.startTimestamp = Date.now() + 60000;
                    match.status = 'ready'

                    activeMatches.set(matchId, match);

                    (match as any).timeoutHandle = setTimeout(() => {
                        if (match.status !== 'started') {
                            match.player1.send(JSON.stringify({ type: 'MATCH_START', matchId }));
                            match.player2.send(JSON.stringify({ type: 'MATCH_START', matchId }));
                            activeMatches.delete(matchId);
                        }
                    }, 60000)

                    p1.send(JSON.stringify({ type: 'MATCH_FOUND', opponent: (p2 as any).username, matchId, role: 'player1', startTimestamp: Date.now() + 60000 }));
                    p2.send(JSON.stringify({ type: 'MATCH_FOUND', opponent: (p1 as any).username, matchId, role: 'player2', startTimestamp: Date.now() + 60000 }));
                }
            }
            else if (data.type === 'READY') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;

                const playerRole = (ws === match.player1) ? 'player1' : 'player2';
                match.setReady(playerRole);

                const opponent = match.getOpponentSocket(playerRole);
                opponent.send(JSON.stringify({ type: 'OPPONENT_READY' }));

                if (match.isBothReady()) {
                    clearTimeout((match as any).timeoutHandle);
                    match.status = 'started';
                    match.player1.send(JSON.stringify({ type: 'MATCH_START', matchId: match.matchId }));
                    match.player2.send(JSON.stringify({ type: 'MATCH_START', matchId: match.matchId }));
                    activeMatches.delete(match.matchId);
                }
            }
            else if (data.type === 'DECLINE') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                match.status = 'cancelled';
                match.player1.send(JSON.stringify({ type: 'MATCH_START' }));
                match.player2.send(JSON.stringify({ type: 'MATCH_START' }));
                activeMatches.delete(match.matchId);
            }
        });

        ws.on('close', () => {
            const index = waitingList.indexOf(ws);
            if (index !== -1) waitingList.splice(index, 1);
        });
    });
}
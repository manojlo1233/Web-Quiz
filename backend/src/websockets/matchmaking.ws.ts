import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

const waitingList: WebSocket[] = [];

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

                    p1.send(JSON.stringify({ type: 'start-quiz', opponent: (p2 as any).username, matchId, role: 'player1' }));
                    p2.send(JSON.stringify({ type: 'start-quiz', opponent: (p1 as any).username, matchId, role: 'player2' }));
                }
            }
        });

        ws.on('close', () => {
            const index = waitingList.indexOf(ws);
            if (index !== -1) waitingList.splice(index, 1);
        });
    });
}
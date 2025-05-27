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

                    setTimeout(() => {
                        if (match.status !== 'started') {
                            startMatch(match);
                        }
                    }, 60000)

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
                    startMatch(match);
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
            else if (data.type === 'PLAYER_ENTERED_BATTLE') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                if ((match.player1 as any).username === data.username) {
                    match.enterP1 = true;
                }
                if ((match.player2 as any).username === data.username) {
                    match.enterP2 = true;
                }
                if (match.enterP1 && match.enterP2) {
                    sendNextQuestion(match);
                }
            }
            else if (data.type === 'ANSWER') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                if ((match.player1 as any).username === data.username) {
                    match.answerP1 = data.answer;
                }
                if ((match.player2 as any).username === data.username) {
                    match.answerP2 = data.answer;
                }
                if (match.answerP1 !== null && match.answerP2 !== null) {
                    sendAnswerSummary(match)
                }
            }
            // FUNCTIONS
            function startMatch(match: Match) {
                match.status = 'started';
                // Dovuci pitanja za mec
                const payload = JSON.stringify({ type: 'MATCH_START', matchId: match.matchId })
                match.player1.send(payload);
                match.player2.send(payload);
            }

            function sendNextQuestion(match: Match) {
                match.currentQuestionIndex += 1;
                const question = 'How much is 2 + 2?'
                const payload = JSON.stringify({ type: 'NEW_QUESTION', question })
                match.player1.send(payload);
                match.player2.send(payload);
                setTimeout(() => {
                    sendAnswerSummary(match)
                })
            }

            function sendAnswerSummary(match: Match) {
                const correctAnswer = '';

                match.player1.send(JSON.stringify({
                    type: 'ANSWER_SUMMARY',
                    yourAnswer: match.answerP1,
                    opponentAnswer: match.answerP2,
                    correctAnswer
                }));

                match.player2.send(JSON.stringify({
                    type: 'ANSWER_SUMMARY',
                    yourAnswer: match.answerP2,
                    opponentAnswer: match.answerP1,
                    correctAnswer
                }));

                // posle kratke pauze, možeš pozvati sendNextQuestion(match);
            }
        });

        ws.on('close', () => {
            const index = waitingList.indexOf(ws);
            if (index !== -1) waitingList.splice(index, 1);
        });
    });
}


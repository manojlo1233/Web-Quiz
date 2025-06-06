import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Match } from '../models/Match';
import { QuizQuestion } from '../models/Quiz/QuizQuestion';
import pool from '../config/db';
import { QuizAnswer } from '../models/Quiz/QuizAnswer';

const waitingList: WebSocket[] = [];
const activeMatches: Map<string, Match> = new Map();
const matchStartTimeout: Map<string, NodeJS.Timeout> = new Map();
const matchQuestions: Map<string, QuizQuestion[]> = new Map();

export default function initWebSocketServer(server: Server) {
    const wss = new WebSocketServer({ server });
    // SEND ANSWER SUMMARY ? SECONDS AFTER QUESTION - IF USERS ARE IDLE
    let answerSummaryIdleTimeout: NodeJS.Timeout;

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

                    const timeout = setTimeout(() => {
                        if (match.status !== 'started') {
                            startMatch(match);
                        }
                    }, 60000)

                    matchStartTimeout.set(match.matchId, timeout);

                    p1.send(JSON.stringify({ type: 'MATCH_FOUND', opponent: (p2 as any).username, matchId, role: 'player1', startTimestamp: match.startTimestamp }));
                    p2.send(JSON.stringify({ type: 'MATCH_FOUND', opponent: (p1 as any).username, matchId, role: 'player2', startTimestamp: match.startTimestamp }));
                }
            }
            else if (data.type === 'READY') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                if (data.username === match.username1) {
                    match.readyP1 = true;
                    match.player2.send(JSON.stringify({ type:'READY_STATUS', username: (match.player1 as any).username, matchId: match.matchId }))
                }
                if (data.username === match.username2) {
                    match.readyP2 = true;
                    match.player1.send(JSON.stringify({ type:'READY_STATUS', username: (match.player2 as any).username, matchId: match.matchId }))
                }
                if (match.readyP1 && match.readyP2 && match.status === 'ready') {
                    startMatch(match);
                }
            }
            else if (data.type === 'DECLINE') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                match.status = 'cancelled';
                activeMatches.delete(match.matchId);
                clearTimeout(matchStartTimeout.get(match.matchId));
                matchStartTimeout.delete(match.matchId)
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
                    if (answerSummaryIdleTimeout) {
                        clearTimeout(answerSummaryIdleTimeout);
                    }
                    // CLEAR SEND SUMMARY ON IDLE USERS
                    sendAnswerSummary(match)
                }
            }
            // FUNCTIONS
            async function startMatch(match: Match) {
                match.status = 'started';
                const questions = await getRandomQuestions(10);
                matchQuestions.set(match.matchId, questions);

                match.currentQuestionIndex = 0;
                const payload = JSON.stringify({ type: 'MATCH_START', matchId: match.matchId })
                match.player1.send(payload);
                match.player2.send(payload);
            }

            async function getRandomQuestions(limit = 10): Promise<QuizQuestion[]> {
                const questionsResult = await pool.query(
                    `SELECT id, text, difficulty FROM questions ORDER BY RAND() LIMIT ?`
                    , [limit]);
                const questions: QuizQuestion[] = (questionsResult[0] as any[]);
                const questionIds = questions.map((q: any) => q.id);
                const answersResult = await pool.query(
                    `SELECT id, question_id, text, is_correct FROM answers WHERE question_id IN (?)`,
                    [questionIds]);

                const answers: QuizAnswer[] = (answersResult[0] as any[]);
                const groupedAnswers: { [key: number]: any[] } = {};
                answers.forEach((a: any) => {
                    if (!groupedAnswers[a.question_id]) {
                        groupedAnswers[a.question_id] = [];
                    }
                    groupedAnswers[a.question_id].push(new QuizAnswer(a.id, a.text, a.is_correct));
                });

                return questions.map((q: any) => ({
                    id: q.id,
                    text: q.text,
                    difficulty: q.difficulty,
                    answers: groupedAnswers[q.id] || []
                }));
            }


            function sendNextQuestion(match: Match) {
                const questions = matchQuestions.get(match.matchId);
                if (!questions || match.currentQuestionIndex >= questions.length) {
                    return;
                }
                const q = questions[match.currentQuestionIndex]
                const payload = JSON.stringify({ type: 'NEW_QUESTION', question: q })
                match.player1.send(payload);
                match.player2.send(payload);
                match.answerP1 = null;
                match.answerP2 = null;
                answerSummaryIdleTimeout = setTimeout(() => {
                    if (match.answerP1 === null || match.answerP2 === null) {
                        sendAnswerSummary(match)
                    }
                }, 10000)
                match.currentQuestionIndex += 1;
            }

            function sendAnswerSummary(match: Match) {
                const questions = matchQuestions.get(match.matchId);
                if (!questions || match.currentQuestionIndex > questions.length) {
                    return;
                }
                const currentQ = questions[match.currentQuestionIndex - 1];
                const correctAns = currentQ.answers.find(a => a.isCorrect);

                const summary = {
                    type: 'ANSWER_SUMMARY',
                    yourAnswer: match.answerP1,
                    opponentAnswer: match.answerP2,
                    correctAnswer: correctAns.text || null
                }

                match.player1.send(JSON.stringify(summary));
                match.player2.send(JSON.stringify({
                    ...summary,
                    yourAnswer: match.answerP2,
                    opponentAnswer: match.answerP1
                }));

                // Možeš odmah slati novo pitanje ili čekati
                setTimeout(() => {
                    sendNextQuestion(match);
                }, 5000);
            }
        });

        ws.on('close', () => {
            const index = waitingList.indexOf(ws);
            if (index !== -1) waitingList.splice(index, 1);
            matchStartTimeout.forEach((v, k) => {
                clearTimeout(v);
            })
        });
    });
}


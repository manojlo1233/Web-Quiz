import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Match } from '../models/Match';
import { QuizQuestion } from '../models/Quiz/QuizQuestion';
import pool from '../config/db';
import { QuizAnswer } from '../models/Quiz/QuizAnswer';
import { BattleStatusMapper } from '../mappers/BattleStatusMapper';

let usersWebSockets: WebSocket[] = [];
let waitingList: WebSocket[] = [];

const activeMatches: Map<string, Match> = new Map();
const matchStartTimeout: Map<string, NodeJS.Timeout> = new Map();
const matchQuestions: Map<string, QuizQuestion[]> = new Map();

export default function initWebSocketServer(server: Server) {
    const wss = new WebSocketServer({ server });
    // SEND ANSWER SUMMARY ? SECONDS AFTER QUESTION - IF USERS ARE IDLE
    let answerSummaryIdleTimeout: NodeJS.Timeout;

    wss.on('connection', (ws) => {
        ws.on('message', async (message) => {
            const data = JSON.parse(message.toString());
            if (data.type === 'USER_SUBSCRIBE') {
                if (usersWebSockets.filter(ws => (ws as any).username === data.username).length !== 0) {
                    usersWebSockets = usersWebSockets.filter(ws => (ws as any).username !== data.username)
                }
                (ws as any).id = data.id;
                (ws as any).username = data.username;
                broadcastActiveUsersChangeEvent(data.id, true);
                usersWebSockets.push(ws);
                console.log(usersWebSockets.length);
            }
            // ----------------- BATTLE -----------------
            if (data.type === 'battle/JOIN_QUEUE') {
                if (waitingList.filter(ws => (ws as any).username === data.username).length !== 0) { // Avoid adding same players to waitinList
                    return;
                }
                (ws as any).username = data.username;
                waitingList.push(ws);

                if (waitingList.length >= 2) {
                    const p1 = waitingList.shift()!;
                    const p2 = waitingList.shift()!;

                    const matchId = (await createMatch()).toString();

                    let match: Match = new Match(matchId, p1, p2, (p1 as any).username, (p2 as any).username);
                    match.status = 'ready';

                    activeMatches.set(matchId, match);

                    const timeout = setTimeout(() => {
                        if (match.status == 'ready') {
                            match.status = 'cancelled';
                            deleteMatchFromDB(match);
                            activeMatches.delete(match.matchId);
                            const payload = JSON.stringify({ type: 'battle/MATCH_CANCELLED' })
                            match.player1.send(payload);
                            match.player2.send(payload);
                        }
                        matchStartTimeout.delete(match.matchId)
                    }, 60000)

                    matchStartTimeout.set(match.matchId, timeout);

                    p1.send(JSON.stringify({ type: 'battle/MATCH_FOUND', opponent: (p2 as any).username, matchId, role: 'player1', startTimestamp: match.startTimestamp }));
                    p2.send(JSON.stringify({ type: 'battle/MATCH_FOUND', opponent: (p1 as any).username, matchId, role: 'player2', startTimestamp: match.startTimestamp }));
                }
            }
            else if (data.type === 'battle/LEAVE_QUEUE') {
                waitingList = waitingList.filter(ws => (ws as any).username !== data.username)
            }
            else if (data.type === 'battle/READY') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                if (data.username === match.username1) {
                    match.readyP1 = true;
                    match.player2.send(JSON.stringify({ type: 'battle/READY_STATUS', username: (match.player1 as any).username, matchId: match.matchId }))
                }
                if (data.username === match.username2) {
                    match.readyP2 = true;
                    match.player1.send(JSON.stringify({ type: 'battle/READY_STATUS', username: (match.player2 as any).username, matchId: match.matchId }))
                }
                if (match.readyP1 && match.readyP2 && match.status === 'ready') {
                    startMatch(match);
                }
            }
            else if (data.type === 'battle/DECLINE') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                deleteMatchFromDB(match);
                match.status = 'cancelled';
                activeMatches.delete(match.matchId);
                clearTimeout(matchStartTimeout.get(match.matchId));
                matchStartTimeout.delete(match.matchId)
                const payload = JSON.stringify({ type: 'battle/MATCH_DECLINED', username: data.username })
                match.player1.send(payload);
                match.player2.send(payload);
            }
            else if (data.type === 'battle/PLAYER_ENTERED_BATTLE') {
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
            else if (data.type === 'battle/ANSWER') {
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
            else if (data.type === 'battle/CHAT_MESSAGE') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;

                const senderUsername = data.username;
                const messageText = data.message;
                const time = data.time;

                const payload = JSON.stringify({
                    type: 'battle/CHAT_MESSAGE',
                    from: senderUsername,
                    message: messageText,
                    time
                })

                // Send to both players
                match.player1.send(payload);
                match.player2.send(payload);
            }

            // ----------------- BATTLE FUNCTIONS -----------------

            async function createMatch(): Promise<number> {
                const [quizResult] = await pool.query(
                    `INSERT INTO quizzes (category_id, created_at) VALUES (0, NOW())`
                )
                return (quizResult as any).insertId;
            }

            async function startMatch(match: Match) {
                match.status = 'started';
                const questions = await getRandomQuestions(5);
                matchQuestions.set(match.matchId, questions);
                insertIntoQuizQuestions(match, questions);
                createQuizAttempts(match)
                createBattle(match);
                match.currentQuestionIndex = 0;
                const payload = JSON.stringify({ type: 'battle/MATCH_START', matchId: match.matchId })
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
                    `SELECT id, question_id, text, is_correct FROM answers WHERE question_id IN (?) ORDER BY RAND()`,
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

            function insertIntoQuizQuestions(match: Match, questions: QuizQuestion[]) {
                questions.forEach(async q => {
                    const [result] = await pool.query(
                        `INSERT INTO quiz_questions (quiz_id, question_id) VALUES (?, ?)`,
                        [Number.parseInt(match.matchId), q.id]
                    )
                    if ((result as any).affectedRows <= 0) {
                        sendError(match);
                    }
                });
            }

            function sendNextQuestion(match: Match) {
                const questions = matchQuestions.get(match.matchId);
                if (!questions || match.currentQuestionIndex >= questions.length) {
                    return;
                }
                const q = questions[match.currentQuestionIndex]
                const payload = JSON.stringify({ type: 'battle/NEW_QUESTION', question: q })
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

                const correctText = correctAns?.text || null;

                if (match.answerP1 === correctText) {
                    match.scoreP1 += 5;
                }

                if (match.answerP2 === correctText) {
                    match.scoreP2 += 5;
                }

                const summary = {
                    type: 'battle/ANSWER_SUMMARY',
                    yourAnswer: match.answerP1,
                    yourScore: match.scoreP1,
                    opponentAnswer: match.answerP2,
                    opponentScore: match.scoreP2,
                    correctAnswer: correctAns.text || null
                }

                match.player1.send(JSON.stringify(summary));
                match.player2.send(JSON.stringify({
                    ...summary,
                    yourAnswer: match.answerP2,
                    yourScore: match.scoreP2,
                    opponentAnswer: match.answerP1,
                    opponentScore: match.scoreP2
                }));

                const attemptP1 = (match.player1 as any).quizAttemptId;
                const attemptP2 = (match.player2 as any).quizAttemptId;
                const answerP1Id = match.answerP1 === null ? null : currentQ.answers.find(a => a.text === match.answerP1).id;
                const answerP2Id = match.answerP2 === null ? null : currentQ.answers.find(a => a.text === match.answerP2).id;
                insertQuizAttempt(attemptP1, currentQ.id, answerP1Id, match.answerP1 === correctText, match);
                insertQuizAttempt(attemptP2, currentQ.id, answerP2Id, match.answerP2 === correctText, match);

                if (match.currentQuestionIndex === questions.length) {
                    setTimeout(() => {
                        finishMatch(match);
                    }, 5000);
                } else {
                    setTimeout(() => {
                        sendNextQuestion(match);
                    }, 5000);
                }
            }

            async function finishMatch(match: Match) {
                match.status = 'finished';
                let winnerId: number | null = null;
                if (match.scoreP1 >= match.scoreP2) {
                    winnerId = (match.player1 as any).id;
                }
                else if (match.scoreP1 < match.scoreP2) {
                    winnerId = (match.player2 as any).id;
                }
                const [resultBattle] = await pool.query(
                    `UPDATE battles SET winner_id=?, status=?, player1_score=?, player2_score=? WHERE quiz_id=?`,
                    [winnerId, BattleStatusMapper.getBattleStatus('finished'), match.scoreP1, match.scoreP2, Number.parseInt(match.matchId)]
                )
                if ((resultBattle as any).affectedRows <= 0) {
                    sendError(match);
                }

                const [resultQuizAttempts] = await pool.query(
                    `UPDATE quiz_attempts SET completed_at=NOW() WHERE quiz_id=?`,
                    [Number.parseInt(match.matchId)]
                )
                if ((resultQuizAttempts as any).affectedRows <= 0) {
                    sendError(match);
                }

                const summary = {
                    type: 'battle/MATCH_FINISHED',
                    yourScore: match.scoreP1,
                    opponentScore: match.scoreP2,
                    winner: winnerId
                }

                match.player1.send(JSON.stringify(summary));
                match.player2.send(JSON.stringify({
                    ...summary,
                    yourScore: match.scoreP2,
                    opponentScore: match.scoreP2
                }));

                // CLEAN UP
                activeMatches.delete(match.matchId);
                matchQuestions.delete(match.matchId);
            }

            async function createQuizAttempts(match: Match) {
                const player1Id = (match.player1 as any).id
                const player2Id = (match.player2 as any).id
                // PLAYER 1 
                const [resultP1] = await pool.query(
                    `INSERT INTO quiz_attempts (quiz_id, user_id, started_at) VALUES (?, ?, NOW())`,
                    [Number.parseInt(match.matchId), player1Id]
                )
                if ((resultP1 as any).affectedRows <= 0) {
                    sendError(match);
                }
                else {
                    (match.player1 as any).quizAttemptId = (resultP1 as any).insertId;
                }
                // PLAYER 2
                const [resultP2] = await pool.query(
                    `INSERT INTO quiz_attempts (quiz_id, user_id, started_at) VALUES (?, ?, NOW())`,
                    [Number.parseInt(match.matchId), player2Id]
                )
                if ((resultP2 as any).affectedRows <= 0) {
                    sendError(match);
                }
                else {
                    (match.player2 as any).quizAttemptId = (resultP2 as any).insertId;
                }
            }

            async function insertQuizAttempt(attemptId: number, questionId: number, answerId: number, isCorrect: boolean, match: Match) {
                const [result] = await pool.query(
                    `INSERT INTO quiz_attempt_questions (attempt_id, question_id, answer_id, is_correct) VALUES (?, ?, ?, ?)`,
                    [attemptId, questionId, answerId, isCorrect]
                )
                if ((result as any).affectedRows <= 0) {
                    sendError(match);
                }
            }

            async function createBattle(match: Match) {
                const player1Id = (match.player1 as any).id
                const player2Id = (match.player2 as any).id
                const [result] = await pool.query(
                    `INSERT INTO battles (quiz_id, player1_id, player2_id, created_at, status, player1_score, player2_score) 
                    VALUES (?, ?, ?, NOW(), ?, 0, 0)`,
                    [Number.parseInt(match.matchId), player1Id, player2Id, BattleStatusMapper.getBattleStatus('started')]
                )
                if ((result as any).affectedRows <= 0) {
                    sendError(match);
                }
            }

            async function deleteMatchFromDB(match: Match) {
                const [resultP2] = await pool.query(
                    `DELETE FROM quizzes WHERE id=?`,
                    [Number.parseInt(match.matchId)]
                )
                if ((resultP2 as any).affectedRows <= 0) {
                    sendError(match);
                }
            }

            function sendError(match: Match) {
                const payload = JSON.stringify({
                    type: 'ERROR'
                })
                match.player1.send(payload);
                match.player2.send(payload);
            }
            // ----------------- END BATTLE FUNCTIONS END -----------------

        });

        ws.on('close', () => {
            waitingList = waitingList.filter(sock => sock !== ws);
            const sock: WebSocket = usersWebSockets.filter(sock => sock === ws)[0];
            usersWebSockets = usersWebSockets.filter(sock => sock !== ws);
            broadcastActiveUsersChangeEvent((sock as any).id, false);
        });
    });
}

function broadcastActiveUsersChangeEvent(userId, online) {
    usersWebSockets.forEach(ws => {
        if ((ws as any).id !== userId) {
            const payload = JSON.stringify({
                type: 'friends/ACTIVE_CHANGE',
                friendId: userId,
                online
            })
            ws.send(payload);
        }
    })
}

export function sendFriendRefreshSignal(userId: number, friendId: number, action: string) {
    if (usersWebSockets.filter(ws => (ws as any).id === friendId).length !== 0) {
        let sock = usersWebSockets.filter(ws => (ws as any).id === friendId)[0];
        sock.send(JSON.stringify({ type: 'friends/REFRESH', action, userId }));
    }
}

export function checkUserFriendsOnlineStatus(userFriends: any[]): any[] {
    const userIds = usersWebSockets.map(ws => (ws as any).id);
    userFriends.forEach(friend => {
        if (userIds.filter(id => id === friend.friendId).length !== 0) {
            friend.online = true
        }
        else {
            friend.online = false;
        }
    });
    return userFriends;
}
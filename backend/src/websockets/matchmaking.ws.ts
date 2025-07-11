import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Match } from '../models/Match';
import { QuizQuestion } from '../models/Quiz/QuizQuestion';
import pool, { updateUserStatisticsAndRanking } from '../config/db';
import { QuizAnswer } from '../models/Quiz/QuizAnswer';
import { BattleStatusMapper } from '../mappers/BattleStatusMapper';
import { availableCategories, clearIntervalFromMap, initCategories } from '../util/util';

const categoryWaitingLists: Map<string, WebSocket[]> = new Map([
    ['General', []],
    ['History', []],
    ['Science', []]
]
);
let adminsWebSockets: WebSocket[] = []; // ALL ACTIVE ADMINS USING ADMIN PAGE
let usersWebSockets: WebSocket[] = []; // ALL ACTIVE USERS
const activeMatches: Map<string, Match> = new Map(); // ALL ACTIVE MATCHES
const matchStartTimeout: Map<string, NodeJS.Timeout> = new Map();
const matchQuestions: Map<string, QuizQuestion[]> = new Map();

const answerSummaryIdleTimeout: Map<string, NodeJS.Timeout> = new Map();

const battleRequestTimeout: Map<string, NodeJS.Timeout> = new Map();

export default function initWebSocketServer(server: Server) {
    const wss = new WebSocketServer({ server });
    // INIT
    initFriendsOnlineStatusBroadcast();
    initCategories();

    wss.on('connection', (ws) => {
        ws.on('message', async (message) => {
            const data = JSON.parse(message.toString());
            if (data.type === 'USER_SUBSCRIBE') {
                if (usersWebSockets.filter(ws => (ws as any).username === data.username).length !== 0) {
                    usersWebSockets = usersWebSockets.filter(ws => (ws as any).username !== data.username)
                }
                (ws as any).id = data.id;
                (ws as any).username = data.username;
                usersWebSockets.push(ws);
            }
            else if (data.type === 'USER_ADMIN_SUBSCRIBE') {
                if (adminsWebSockets.filter(ws => (ws as any).username === data.username).length !== 0) {
                    adminsWebSockets = adminsWebSockets.filter(ws => (ws as any).username !== data.username)
                }
                (ws as any).id = data.id;
                (ws as any).username = data.username;
                adminsWebSockets.push(ws);
            }
            // ----------------- BATTLE -----------------
            else if (data.type === 'battle/JOIN_QUEUE') {
                const waitingList = categoryWaitingLists.get(data.category);
                if (waitingList.filter(ws => (ws as any).username === data.username).length !== 0) { // Avoid adding same players to waitinList
                    return;
                }
                (ws as any).id = data.userId;
                (ws as any).username = data.username;
                waitingList.push(ws);

                if (waitingList.length >= 2) {
                    const p1 = waitingList.shift()!;
                    const p2 = waitingList.shift()!;
                    createMatch(p1, p2, data.category);
                }
            }
            else if (data.type === 'battle/LEAVE_QUEUE') {
                let waitingList = categoryWaitingLists.get(data.category);
                waitingList = waitingList.filter(ws => (ws as any).username !== data.username)
            }
            else if (data.type === 'battle/READY') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                if (data.username === match.player1.username) {
                    match.player1.ready = true;
                    match.player2.sock.send(JSON.stringify({ type: 'battle/READY_STATUS', username: match.player1.username, matchId: match.matchId }))
                }
                if (data.username === match.player2.username) {
                    match.player2.ready = true;
                    match.player1.sock.send(JSON.stringify({ type: 'battle/READY_STATUS', username: match.player2.username, matchId: match.matchId }))
                }
                if (match.player1.ready && match.player2.ready && match.status === 'ready') {
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

                // MAKE SURE USERS ARE NOT IN QUEUE
                let waitingList = categoryWaitingLists.get(match.category);
                waitingList = waitingList.filter(ws => (ws as any).username !== match.player1.username || (ws as any).username !== match.player2.username);
                categoryWaitingLists.set(match.category, waitingList);

                match.player1.sock.send(payload);
                match.player2.sock.send(payload);
            }
            else if (data.type === 'battle/PLAYER_ENTERED_BATTLE') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                if (match.player1.username === data.username) {
                    match.player1.enter = true;
                }
                if (match.player2.username === data.username) {
                    match.player2.enter = true;
                }
                if (match.player1.enter && match.player2.enter) {
                    sendNextQuestion(match);
                }
            }
            else if (data.type === 'battle/ANSWER') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                if (match.player1.username === data.username) {
                    match.player1.answer = data.answer;
                    match.player1.elapsedTime = data.responseTime;
                }
                if (match.player2.username === data.username) {
                    match.player2.answer = data.answer;
                    match.player2.elapsedTime = data.responseTime;
                }
                if (match.player1.answer !== null && match.player2.answer !== null) {
                    if (answerSummaryIdleTimeout.has(match.matchId)) {
                        clearTimeout(answerSummaryIdleTimeout.get(match.matchId));
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
                match.player1.sock.send(payload);
                match.player2.sock.send(payload);
            }
            else if (data.type === 'friends/BATTLE_REQUEST') {
                const sockCheck = usersWebSockets.filter(ws => (ws as any).id === data.friendId);
                if (sockCheck.length === 0) return;
                const friendSock = sockCheck[0];
                const payload = JSON.stringify({
                    type: 'friends/BATTLE_REQUEST',
                    friendId: data.userId
                })
                friendSock.send(payload);
                battleRequestTimeout.set(
                    `${data.userId}-${data.friendId}`,
                    setTimeout(() => { // WITHDRAW BATTLE REQUEST
                        // SEND WITHDRAW TO RECEIVER
                        const payloadReceiver = JSON.stringify({
                            type: 'friends/BATTLE_WITHDRAW',
                            friendId: data.userId
                        })
                        friendSock.send(payloadReceiver);
                        // SEND AUTOWITHDRAW TO SENDER
                        const sockCheck = usersWebSockets.filter(ws => (ws as any).id === data.userId);
                        if (sockCheck.length === 0) return;
                        const userSock = sockCheck[0];
                        const payloadSender = JSON.stringify({
                            type: 'friends/BATTLE_AUTO_WITHDRAW',
                            friendId: data.friendId
                        })
                        userSock.send(payloadSender);
                    }, 30000)
                )
            }
            else if (data.type === 'friends/BATTLE_ACCEPT') {
                clearIntervalFromMap(battleRequestTimeout, `${data.friendId}-${data.userId}`);
                const p1 = usersWebSockets.filter(ws => (ws as any).id === data.userId)[0];
                const p2 = usersWebSockets.filter(ws => (ws as any).id === data.friendId)[0];
                createMatch(p1, p2, 'General');
            }
            else if (data.type === 'friends/BATTLE_DECLINE') {
                clearIntervalFromMap(battleRequestTimeout, `${data.friendId}-${data.userId}`);
                const sockCheck = usersWebSockets.filter(ws => (ws as any).id === data.friendId);
                if (sockCheck.length === 0) return;
                const friendSock = sockCheck[0];
                const payload = JSON.stringify({
                    type: 'friends/BATTLE_DECLINE',
                    friendId: data.userId
                })
                friendSock.send(payload);
            }
            else if (data.type === 'friends/BATTLE_WITHDRAW') {
                clearIntervalFromMap(battleRequestTimeout, `${data.userId}-${data.friendId}`);
                const sockCheck = usersWebSockets.filter(ws => (ws as any).id === data.friendId);
                if (sockCheck.length === 0) return;
                const friendSock = sockCheck[0];
                const payload = JSON.stringify({
                    type: 'friends/BATTLE_WITHDRAW',
                    friendId: data.userId
                })
                friendSock.send(payload);
            }
            else if (data.type === 'battle/LEAVE_BATTLE') {
                const matchId = data.matchId;
                const playerLeftId = data.playerLeftId;
                const match = activeMatches.get(matchId);
                if (!match) return; // SOME KIND OF ERROR
                finishMatch(match, playerLeftId);
            }
            else if (data.type === 'battle/START_OVERTIME') {
                const match = activeMatches.get(data.matchId);
                if (!match) return;
                if (match.player1.username === data.username) {
                    match.player1.overtimeReady = true;
                }
                if (match.player2.username === data.username) {
                    match.player2.overtimeReady = true;
                }
                if (match.player1.overtimeReady && match.player2.overtimeReady) {
                    sendNextQuestion(match);
                }
            }

            // ------------------------------------------------------------------------------------------------------------------------
            // --------------------------------------------------- BATTLE FUNCTIONS ---------------------------------------------------
            // ------------------------------------------------------------------------------------------------------------------------

            async function createMatch(p1: WebSocket, p2: WebSocket, category: string) {
                const matchId = (await createMatchInDB(category)).toString();

                let match: Match = new Match(matchId, p1, p2, (p1 as any).id, (p2 as any).id, (p1 as any).username, (p2 as any).username, category);
                match.status = 'ready';

                activeMatches.set(matchId, match);

                const timeout = setTimeout(() => {
                    if (match.status == 'ready') {
                        match.status = 'cancelled';
                        deleteMatchFromDB(match);
                        activeMatches.delete(match.matchId);
                        const payload = JSON.stringify({ type: 'battle/MATCH_CANCELLED' })
                        match.player1.sock.send(payload);
                        match.player2.sock.send(payload);
                    }
                    matchStartTimeout.delete(match.matchId)
                }, 60000)

                matchStartTimeout.set(match.matchId, timeout);

                p1.send(JSON.stringify({ type: 'battle/MATCH_FOUND', opponent: match.player2.username, matchId, role: 'player1', startTimestamp: match.startTimestamp }));
                p2.send(JSON.stringify({ type: 'battle/MATCH_FOUND', opponent: match.player1.username, matchId, role: 'player2', startTimestamp: match.startTimestamp }));
            }

            async function createMatchInDB(category: string): Promise<number> {
                const cat = availableCategories.filter(c => c.name === category)[0];
                const categoryId = cat.id;
                const [quizResult] = await pool.query(
                    `INSERT INTO quizzes (category_id, created_at) VALUES (?, NOW())`,
                    [categoryId]
                )
                return (quizResult as any).insertId;
            }

            async function startMatch(match: Match) {
                match.status = 'started';
                const questions = await getRandomQuestions(5, match.category);
                matchQuestions.set(match.matchId, questions);
                insertIntoQuizQuestions(match, questions);
                createQuizAttempts(match)
                createBattle(match);
                match.currentQuestionIndex = 0;
                const payload = JSON.stringify({ type: 'battle/MATCH_START', matchId: match.matchId })
                match.player1.sock.send(payload);
                match.player2.sock.send(payload);
            }

            async function getRandomQuestions(limit = 10, category: string): Promise<QuizQuestion[]> {
                const questionsResult = await pool.query(
                    `   SELECT q.id, q.text, q.difficulty, q.description 
                        FROM questions q
                        JOIN categories c ON c.id = q.category_id
                        WHERE (? = 'General' OR c.name = ?)
                        ORDER BY RAND() 
                        LIMIT ?
                    `
                    , [category, category, limit]);
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
                match.player1.answer = null;
                match.player2.answer = null;
                match.player1.elapsedTime = null;
                match.player2.elapsedTime = null;
                match.player1.sock.send(payload);
                match.player2.sock.send(payload);
                answerSummaryIdleTimeout.set(match.matchId, setTimeout(() => {
                    if (match.player1.answer === null || match.player2.answer === null) {
                        sendAnswerSummary(match)
                    }
                }, 10000)
                )
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

                if (match.player1.answer) {
                    if (match.player1.answer === correctText) {
                        match.player1.points += 10;
                    }
                    else {
                        match.player1.points -= 5;
                    }

                }

                if (match.player2.answer) {
                    if (match.player2.answer === correctText) {
                        match.player2.points += 10;
                    }
                    else {
                        match.player2.points -= 5;
                    }
                }

                const summary = {
                    type: 'battle/ANSWER_SUMMARY',
                    yourAnswer: match.player1.answer,
                    yourPoints: match.player1.points,
                    yourTime: match.player1.elapsedTime,
                    opponentAnswer: match.player2.answer,
                    opponentPoints: match.player2.points,
                    opponentTime: match.player2.elapsedTime,
                    correctAnswer: correctAns.text || null
                }

                match.player1.sock.send(JSON.stringify(summary));
                match.player2.sock.send(JSON.stringify({
                    ...summary,
                    yourAnswer: match.player2.answer,
                    yourPoints: match.player2.points,
                    yourTime: match.player2.elapsedTime,
                    opponentAnswer: match.player1.answer,
                    opponentPoints: match.player1.points,
                    opponentTime: match.player1.elapsedTime
                }));

                const attemptP1 = (match.player1.sock as any).quizAttemptId;
                const attemptP2 = (match.player2.sock as any).quizAttemptId;
                const answerP1Id = match.player1.answer === null ? null : currentQ.answers.find(a => a.text === match.player1.answer).id;
                const answerP2Id = match.player2.answer === null ? null : currentQ.answers.find(a => a.text === match.player2.answer).id;
                insertQuizAttempt(attemptP1, currentQ.id, answerP1Id, match.player1.answer === correctText, match);
                insertQuizAttempt(attemptP2, currentQ.id, answerP2Id, match.player2.answer === correctText, match);

                if (match.status === 'overtime') {
                    const correctP1 = match.player1.answer === correctText;
                    const correctP2 = match.player2.answer === correctText;
                    if (correctP1 && correctP2) {
                        if (match.player1.elapsedTime > match.player2.elapsedTime) {
                            finishMatch(match, null, match.player2.id);
                        }
                        else if (match.player1.elapsedTime < match.player2.elapsedTime) {
                            finishMatch(match, null, match.player1.id);
                        }
                    }
                    else if (correctP1) {
                        finishMatch(match, null, match.player1.id);
                    }
                    else if (correctP2) {
                        finishMatch(match, null, match.player2.id);
                    }
                }

                if (match.currentQuestionIndex === questions.length) {
                    setTimeout(async () => {
                        if (match.status === 'overtime' || match.player1.points !== match.player2.points) {
                            finishMatch(match);
                        }
                        else {
                            const newQuestions = await getOvertimeQuestions(questions, 50, match.category);
                            matchQuestions.set(match.matchId, newQuestions);
                            insertIntoQuizQuestions(match, newQuestions);
                            match.status = 'overtime';
                            match.currentQuestionIndex = 0;
                            const payload = {
                                type: 'battle/OVERTIME'
                            }
                            match.player1.sock.send(JSON.stringify(payload));
                            match.player2.sock.send(JSON.stringify(payload));
                        }

                    }, 5000);
                } else {
                    setTimeout(() => {
                        sendNextQuestion(match);
                    }, 5000);
                }
            }

            async function finishMatch(match: Match, playerLeftId: number = null, overtimeWinnerId: number = null) {
                match.status = 'finished';
                let winnerId: number | null = null;
                let winnerUsername: string = null;
                let playerLeftUsername = null;
                if (overtimeWinnerId) {
                    winnerId = overtimeWinnerId;
                    if (match.player1.id === overtimeWinnerId) {
                        winnerUsername = match.player1.username;
                    }
                    else {
                        winnerUsername = match.player2.username;
                    }
                }
                else if (playerLeftId) {
                    if (playerLeftId === match.player1.id) {
                        winnerId = match.player2.id;
                        winnerUsername = match.player2.username;
                        playerLeftUsername = match.player1.username;
                    }
                    else {
                        winnerId = match.player1.id;
                        winnerUsername = match.player1.username;
                        playerLeftUsername = match.player2.username;
                    }
                }
                else {
                    if (match.player1.points > match.player2.points) {
                        winnerId = match.player1.id;
                        winnerUsername = match.player1.username;
                    }
                    else if (match.player1.points < match.player2.points) {
                        winnerId = match.player2.id;
                        winnerUsername = match.player2.username;
                    }

                }

                const [resultBattle] = await pool.query(
                    `UPDATE battles SET winner_id=?, status=?, player1_points=?, player2_points=?, player_left_id=? WHERE quiz_id=?`,
                    [winnerId, BattleStatusMapper.getBattleStatus('finished'), match.player1.points, match.player2.points, playerLeftId, Number.parseInt(match.matchId)]
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

                updateUserStatisticsAndRanking(match.player1.id, winnerId, match.category);
                updateUserStatisticsAndRanking(match.player2.id, winnerId, match.category);

                const summary = {
                    type: 'battle/MATCH_FINISHED',
                    yourPoints: match.player1.points,
                    yourTime: match.player1.elapsedTime,
                    opponentPoints: match.player2.points,
                    opponentTime: match.player2.elapsedTime,
                    winnerId,
                    winnerUsername,
                    playerLeftId,
                    playerLeftUsername
                }

                match.player1.sock.send(JSON.stringify(summary));
                match.player2.sock.send(JSON.stringify({
                    ...summary,
                    yourPoints: match.player2.points,
                    yourTime: match.player2.elapsedTime,
                    opponentPoints: match.player1.points,
                    opponentTime: match.player1.elapsedTime,
                }));

                // CLEAN UP
                activeMatches.delete(match.matchId);
                matchQuestions.delete(match.matchId);
            }

            async function createQuizAttempts(match: Match) {
                const player1Id = match.player1.id
                const player2Id = match.player2.id
                // PLAYER 1 
                const [resultP1] = await pool.query(
                    `INSERT INTO quiz_attempts (quiz_id, user_id, started_at) VALUES (?, ?, NOW())`,
                    [Number.parseInt(match.matchId), player1Id]
                )
                if ((resultP1 as any).affectedRows <= 0) {
                    sendError(match);
                }
                else {
                    (match.player1.sock as any).quizAttemptId = (resultP1 as any).insertId;
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
                    (match.player2.sock as any).quizAttemptId = (resultP2 as any).insertId;
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
                const player1Id = match.player1.id
                const player2Id = match.player2.id
                const [result] = await pool.query(
                    `INSERT INTO battles (quiz_id, player1_id, player2_id, created_at, status, player1_points, player2_points) 
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
                match.player1.sock.send(payload);
                match.player2.sock.send(payload);
            }

            async function getOvertimeQuestions(oldQuestions: QuizQuestion[], limit: number = 50, category: string) {
                const usedIds = oldQuestions.map(q => q.id);
                const questionsResult = await pool.query(
                    `
                        SELECT q.id, q.text, q.difficulty 
                        FROM questions q
                        JOIN category c ON q.category_id = c.id
                        WHERE id NOT IN (${usedIds.join(',') || 'NULL'}) AND (? = 'General' OR c.name=?)
                        ORDER BY RAND() LIMIT ?
                    `
                    , [limit, category, category]);
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
            // ----------------- END BATTLE FUNCTIONS END -----------------

        });

        ws.on('close', () => {
            categoryWaitingLists.forEach(waitingList => {
                waitingList = waitingList.filter(sock => sock !== ws);
            })
            usersWebSockets = usersWebSockets.filter(sock => sock !== ws);
            adminsWebSockets = adminsWebSockets.filter(sock => sock !== ws);
        });
    });
}

function initFriendsOnlineStatusBroadcast() {
    setInterval(() => {
        usersWebSockets.forEach(ws => {
            ws.send(JSON.stringify({ type: 'broadcast/REFRESH_FRIENDS', id: (ws as any).id }));
        })
    }, 5000);
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

export function checkIfUserSessionExists(userId: number): boolean {
    let ret = false;
    usersWebSockets.forEach(ws => {
        if ((ws as any).id === userId) {
            ret = true;
        }
    });
    return ret;
}

export function isUserOnline(userId: number): boolean {
    let online = false;
    usersWebSockets.forEach(ws => {
        if (online) return;
        if ((ws as any).id === userId) {
            online = true;
            return;
        }
    })
    return online;
}

export function broadCastUserBanned(userId: number, banned_until: string) {
    const payload = JSON.stringify({
        type: 'admin/USER_BANNED',
        userId,
        banned_until
    });
    adminsWebSockets.forEach(ws => {
        ws.send(payload);
    })
    usersWebSockets.forEach(ws => {
        if ((ws as any).id === userId) {
            ws.send(payload);
        }
    })
}

export function broadCastUserUnbanned(userId: number) {
    const payload = JSON.stringify({
        type: 'admin/USER_UNBANNED',
        userId
    });
    adminsWebSockets.forEach(ws => {
        ws.send(payload);
    })
    usersWebSockets.forEach(ws => {
        if ((ws as any).id === userId) {
            ws.send(payload);
        }
    })
}

export function broadcastUserDeleted(userId: number) {
    const payload = JSON.stringify({
        type: 'admin/USER_DELETED',
        userId
    });
    adminsWebSockets.forEach(ws => {
        ws.send(payload);
    })
    usersWebSockets.forEach(ws => {
        if ((ws as any).id === userId) {
            ws.send(payload);
        }
    })
}
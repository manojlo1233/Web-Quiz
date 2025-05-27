import WebSocket from "ws";

export class Match {
    matchId: string;
    player1: WebSocket;
    player2: WebSocket;
    username1: string;
    username2: string;
    startTimestamp: number;
    readyP1: boolean = false;
    readyP2: boolean = false;
    enterP1: boolean = false;
    enterP2: boolean = false;
    currentQuestionIndex: number;
    answerP1: string;
    answerP2: string;
    status: 'waiting' | 'ready' | 'started' | 'cancelled' = 'waiting';


    constructor(matchId: string, player1: WebSocket, player2: WebSocket,
        username1: string, username2: string) {
            this.matchId = matchId;
            this.player1 = player1;
            this.player2 = player2;
            this.username1 = username1;
            this.username2 = username2;
            this.startTimestamp = Date.now() + 60000;
            this.currentQuestionIndex = -1;
        }

    setReady(playerRole: 'player1' | 'player2') {
        this[playerRole === 'player1' ? 'readyP1' : 'readyP2'] = true;
    }

    isBothReady() {
        return this.readyP1 && this.readyP2;
    }

    getOpponentSocket(role: 'player1' | 'player2'): WebSocket {
        return role === 'player1' ? this.player2 : this.player1;
    }
}
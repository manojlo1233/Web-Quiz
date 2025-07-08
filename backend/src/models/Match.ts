import WebSocket from "ws";
import { Player } from "./Player";

export class Match {
    matchId: string;
    startTimestamp: number;
    currentQuestionIndex: number;
    player1: Player;
    player2: Player;
    status: 'waiting' | 'ready' | 'started' | 'cancelled' | 'overtime' | 'finished' = 'waiting';
    category: string;

    constructor(
        matchId: string,
        sock1: WebSocket,
        sock2: WebSocket,
        id1: number,
        id2: number,
        username1: string,
        username2: string,
        category: string,
    ) {
        this.matchId = matchId;
        this.player1 = new Player(sock1, id1, username1);
        this.player2 = new Player(sock2, id2, username2);
        this.startTimestamp = Date.now() + 60000;
        this.currentQuestionIndex = -1;
        this.category = category;
    }

    setReady(playerRole: 'player1' | 'player2') {
        this[playerRole === 'player1' ? 'readyP1' : 'readyP2'] = true;
    }

    isBothReady() {
        return this.player1.ready && this.player2.ready;
    }

    getOpponentSocket(role: 'player1' | 'player2'): WebSocket {
        return role === 'player1' ? this.player2.sock : this.player1.sock;
    }
}
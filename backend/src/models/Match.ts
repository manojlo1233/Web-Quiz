import WebSocket from "ws";

export class Match {
    matchId: string;
    player1: WebSocket;
    player2: WebSocket;
    startTimestamp: number;
    readyStatus: {
        p1: boolean;
        p2: boolean;
    }
    status: 'waiting' | 'ready' | 'started' | 'cancelled' = 'waiting';

    setReady(playerRole: 'player1' | 'player2') {
        this.readyStatus[playerRole === 'player1' ? 'p1' : 'p2'] = true;
    }

    isBothReady() {
        return this.readyStatus.p1 && this.readyStatus.p2;
    }

    getOpponentSocket(role: 'player1' | 'player2'): WebSocket {
        return role === 'player1' ? this.player2 : this.player1;
    }
}
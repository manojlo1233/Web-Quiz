import WebSocket from "ws";
export class Player {
    sock: WebSocket;
    id: number;
    username: string;
    ready: boolean = false;
    overtimeReady: boolean = false;
    enter: boolean = false;
    answer: string;
    elapsedTime: number;
    points: number;
    activeAction: number;

    constructor(sock: WebSocket, id: number, username: string) {
        this.sock = sock;
        this.id = id;
        this.username = username;
        this.answer = null;
        this.elapsedTime = null;
        this.points = 0;
        this.activeAction = null;
    }
}
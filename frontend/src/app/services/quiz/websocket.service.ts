import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  constructor() { }

  private socket: WebSocket | null = null;

  public connectionOpen$ = new Subject<void>();
  public error$ = new Subject<string>();
  // BATTLE
  public startQuiz$ = new Subject<any>();
  public readyStatus$ = new Subject<{ username: string, matchId: string }>();
  public matchStart$ = new Subject<any>();
  public matchDeclined$ = new Subject<string>();
  public newQuestion$ = new Subject<any>();
  public answerSummary$ = new Subject<any>();
  // FRIENDS
  public refreshFriends$ = new Subject<any>();

  connect(): void {
    this.socket = new WebSocket('ws://localhost:3000');

    this.socket.onopen = () => {
      this.connectionOpen$.next();
      console.log('Websocket connection open');
    }

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data.type);
      switch (data.type) {

        // -------------- BATTLE --------------
        case 'battle/MATCH_FOUND':
          this.startQuiz$.next(data);
          break;
        case 'battle/READY_STATUS':
          this.readyStatus$.next({ username: data.username, matchId: data.matchid });
          break;
        case 'battle/MATCH_START':
          this.matchStart$.next(data);
          break;
        case 'battle/MATCH_DECLINED':
          this.matchDeclined$.next(data.matchId);
          break;
        case 'battle/NEW_QUESTION':
          this.newQuestion$.next(data);
          break;
        case 'battle/ANSWER_SUMMARY':
          this.answerSummary$.next(data);
          break;
        case 'friends/REFRESH':
          this.refreshFriends$.next({ userId: data.userId, action: data.action });
          break;
      }
    };

    this.socket.onclose = () => {
      console.log('Websocket connection closed');
    }

    this.socket.onerror = (error) => {
      this.error$.next('Error connecting to server websocket connection');
    }
  }

  private send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
    else {
      console.warn('WebSocket not open')
    }
  }

  sendHello(id: number, username: string) {
    this.send({ type: 'USER_SUBSCRIBE', id, username });
  }

  joinMatchmaking(username: string): void {
    this.send({ type: 'battle/JOIN_QUEUE', username });
  }

  cancelMatchmaking(username: string): void {
    this.send({ type: 'battle/LEAVE_QUEUE', username });
  }

  sendReady(matchId: string, username: string): void {
    this.send({ type: 'battle/READY', matchId, username });
  }

  sendDecline(matchId: string, username: string): void {
    this.send({ type: 'battle/DECLINE', matchId, username });
  }

  sendEnterBattle(matchId: string, username: string) {
    this.send({ type: 'battle/PLAYER_ENTERED_BATTLE', matchId, username });
  }

  sendBattleAnswer(matchId: string, username: string, answer: string) {
    this.send({ type: 'battle/ANSWER', matchId, username, answer });
  }

  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  getWebSocket() {

  }
}

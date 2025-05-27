import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  constructor() { }

  private socket: WebSocket | null = null;

  public error$ = new Subject<string>();
  public startQuiz$ = new Subject<any>();
  public readyStatus$ = new Subject<{ username: string, matchId: string }>();
  public matchStart$ = new Subject<any>();
  public matchDeclined$ = new Subject<string>();
  public newQuestion$ = new Subject<any>();

  connect(): void {
    this.socket = new WebSocket('ws://192.168.19.62:3000');

    this.socket.onopen = () => {
      console.log('Websocket connection open');
    }

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'MATCH_FOUND':
          this.startQuiz$.next(data);
          break;
        case 'READY_STATUS':
          this.readyStatus$.next({ username: data.username, matchId: data.matchid });
          break;
        case 'MATCH_START':
          this.matchStart$.next(data);
          break;
        case 'MATCH_DECLINED':
          this.matchDeclined$.next(data.matchId);
          break;
        case 'NEW_QUESTION':
          this.newQuestion$.next(data);
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

  joinMatchmaking(username: string): void {
    this.send({ type: 'join-queue', username })
  }

  sendReady(matchId: string, username: string): void {
    this.send({ type: 'READY', matchId, username });
  }

  sendDecline(matchId: string, username: string): void {
    this.send({ type: 'DECLINE', matchId, username });
  }

  sendEnterBattle(matchId: string, username: string) {
    this.send({type: 'PLAYER_ENTERED_BATTLE', matchId, username});
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

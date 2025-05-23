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

  connect(): void {
    this.socket = new WebSocket('ws://192.168.19.62:3000');

    this.socket.onopen = () => {
      console.log('Websocket connection open');
    }

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received via ws: ', data);

      if (data.type === 'start-quiz') {
        this.startQuiz$.next(data);
      }
    };

    this.socket.onclose = () => {
      console.log('Websocket connection closed');
    }

    this.socket.onerror = (error) => {
      this.error$.next('Error connecting to server websocket connection');
    }
  }

  send(data: any): void {
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

  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

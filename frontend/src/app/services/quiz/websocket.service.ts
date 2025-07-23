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
  public matchCancelled$ = new Subject<void>();
  public matchFinished$ = new Subject<void>();
  public newQuestion$ = new Subject<any>();
  public answerSummary$ = new Subject<any>();
  public battleRequest$ = new Subject<any>();
  public battleDecline$ = new Subject<any>();
  public battleWithdraw$ = new Subject<any>();
  public battleAutoWithdraw$ = new Subject<any>();
  public battleReadyOvertime$ = new Subject<void>();
  public battleUserAction$ = new Subject<any>();
  // ADMIN
  public adminUserBanned$ = new Subject<any>();
  public adminUserUnbanned$ = new Subject<any>();
  public adminUserDeleted$ = new Subject<any>();
  public adminUsersOnline$ = new Subject<void>();
  // BATTLE - CHAT
  public chatMessage$ = new Subject<any>();
  // FRIENDS
  public refreshFriends$ = new Subject<any>();
  // BROADCAST
  public refreshFriendsStatus$ = new Subject<void>();

  connect(): void {
    const sessionToken = sessionStorage.getItem('sessionToken');
    this.socket = new WebSocket(`ws://localhost:3000?token=${sessionToken}`);

    this.socket.onopen = () => {
      this.connectionOpen$.next();
      console.log('Websocket connection open');
    }

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
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
          this.matchDeclined$.next(data);
          break;
        case 'battle/MATCH_CANCELLED':
          this.matchCancelled$.next();
          break;
        case 'battle/NEW_QUESTION':
          this.newQuestion$.next(data);
          break;
        case 'battle/ANSWER_SUMMARY':
          this.answerSummary$.next(data);
          break;
        case 'battle/CHAT_MESSAGE':
          this.chatMessage$.next({ username: data.from, message: data.message, time: data.time });
          break;
        case 'battle/MATCH_FINISHED':
          this.matchFinished$.next(data);
          break;
        case 'friends/REFRESH':
          this.refreshFriends$.next({ userId: data.userId, action: data.action });
          break;
        case 'friends/BATTLE_REQUEST':
          this.battleRequest$.next(data);
          break;
        case 'friends/BATTLE_DECLINE':
          this.battleDecline$.next(data);
          break;
        case 'friends/BATTLE_WITHDRAW':
          this.battleWithdraw$.next(data);
          break;
        case 'friends/BATTLE_AUTO_WITHDRAW':
          this.battleAutoWithdraw$.next(data);
          break;
        case 'broadcast/REFRESH_FRIENDS':
          this.refreshFriendsStatus$.next();
          break;
        case 'battle/OVERTIME':
          this.battleReadyOvertime$.next();
          break;
        case '/battle/USER_ACTION':
          this.battleUserAction$.next(data);
          break;
        case 'admin/USERS_ONLINE':
          this.adminUsersOnline$.next(data);
          break;
        case 'admin/USER_BANNED':
          this.adminUserBanned$.next({ userId: data.userId, banned_until: data.banned_until });
          break;
        case 'admin/USER_UNBANNED':
          this.adminUserUnbanned$.next(data);
          break;
        case 'admin/USER_DELETED':
          this.adminUserDeleted$.next(data);
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

  sendHelloAsAdmin(id: number, username: string): void {
    this.send({ type: 'USER_ADMIN_SUBSCRIBE', id, username });
  }

  sendHello(id: number, username: string): void {
    this.send({ type: 'USER_SUBSCRIBE', id, username });
  }

  joinMatchmaking(userId: number, username: string, category: string, score: number): void {
    this.send({ type: 'battle/JOIN_QUEUE', userId, username, category, score });
  }

  relaxMatchmaking(userId: number, username: string, category: string, score: number): void {
    this.send({ type: 'battle/RELAX_QUEUE', userId, username, category, score});
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

  sendBattleAnswer(matchId: string, username: string, answer: string, responseTime: number) {
    this.send({ type: 'battle/ANSWER', matchId, username, answer, responseTime });
  }

  sendChatMessage(matchId: string, username: string, message: string, time: string) {
    this.send({ type: 'battle/CHAT_MESSAGE', matchId, username, message, time });
  }

  sendBattleRequest(userId: number, friendId: number) {
    this.send({ type: 'friends/BATTLE_REQUEST', userId, friendId });
  }

  sendBattleWithdraw(userId: number, friendId: number) {
    this.send({ type: 'friends/BATTLE_WITHDRAW', userId, friendId });
  }

  sendBattleAccept(userId: number, friendId: number) {
    this.send({ type: 'friends/BATTLE_ACCEPT', userId, friendId });
  }

  sendBattleDecline(userId: number, friendId: number) {
    this.send({ type: 'friends/BATTLE_DECLINE', userId, friendId });
  }

  sendLeaveBattle(matchId: number, playerLeftId: number) {
    this.send({ type: 'battle/LEAVE_BATTLE', matchId, playerLeftId });
  }

  sendStartOvertime(matchId: number, username: string) {
    this.send({ type: 'battle/START_OVERTIME', matchId, username });
  }

  sendAction(matchId: number, userId: number, action: number, questionId: number) {
    this.send({ type: 'battle/USER_ACTION', matchId, userId, action, questionId })
  }

  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

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
  public adminBanExpired$ = new Subject<void>();
  // BATTLE - CHAT
  public chatMessage$ = new Subject<any>();
  // FRIENDS
  public refreshFriends$ = new Subject<any>();
  // BROADCAST
  public refreshFriendsStatus$ = new Subject<void>();

  // MSG TYPES
  private WS_MESSAGES_TYPE = {
    USER_SUBSCRIBE: 0,
    USER_ADMIN_SUBSCRIBE: 1,
    battle_JOIN_QUEUE: 2,
    battle_RELAX_QUEUE: 3,
    battle_LEAVE_QUEUE: 4,
    battle_MATCH_FOUND: 5,
    battle_READY: 6,
    battle_READY_STATUS: 7,
    battle_MATCH_CANCELLED: 8,
    battle_DECLINE: 9,
    battle_MATCH_DECLINED: 10,
    battle_MATCH_START: 11,
    battle_PLAYER_ENTERED_BATTLE: 12,
    battle_ANSWER: 13,
    battle_ANSWER_SUMMARY: 14,
    battle_NEW_QUESTION: 15,
    battle_CHAT_MESSAGE: 16,
    battle_LEAVE_BATTLE: 17,
    battle_OVERTIME: 18,
    battle_START_OVERTIME: 19,
    battle_USER_ACTION: 20,
    battle_MATCH_FINISHED: 21,
    friends_BATTLE_REQUEST: 22,
    friends_BATTLE_WITHDRAW: 23,
    friends_BATTLE_AUTO_WITHDRAW: 24,
    friends_BATTLE_ACCEPT: 25,
    friends_BATTLE_DECLINE: 26,
    friends_REFRESH: 27,
    broadcast_REFRESH_FRIENDS: 28,
    admin_USER_BANNED: 29,
    admin_USER_UNBANNED: 30,
    admin_USER_DELETED: 31,
    admin_BAN_EXPIRED: 32,
    admin_USERS_ONLINE: 33,
  }

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
        case this.WS_MESSAGES_TYPE.battle_MATCH_FOUND:
          this.startQuiz$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.battle_READY_STATUS:
          this.readyStatus$.next({ username: data.username, matchId: data.matchid });
          break;
        case this.WS_MESSAGES_TYPE.battle_MATCH_START:
          this.matchStart$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.battle_MATCH_DECLINED:
          this.matchDeclined$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.battle_MATCH_CANCELLED:
          this.matchCancelled$.next();
          break;
        case this.WS_MESSAGES_TYPE.battle_NEW_QUESTION:
          this.newQuestion$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.battle_ANSWER_SUMMARY:
          this.answerSummary$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.battle_CHAT_MESSAGE:
          this.chatMessage$.next({ username: data.from, message: data.message, time: data.time });
          break;
        case this.WS_MESSAGES_TYPE.battle_MATCH_FINISHED:
          this.matchFinished$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.friends_REFRESH:
          this.refreshFriends$.next({ userId: data.userId, action: data.action });
          break;
        case this.WS_MESSAGES_TYPE.friends_BATTLE_REQUEST:
          this.battleRequest$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.friends_BATTLE_DECLINE:
          this.battleDecline$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.friends_BATTLE_WITHDRAW:
          this.battleWithdraw$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.friends_BATTLE_AUTO_WITHDRAW:
          this.battleAutoWithdraw$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.broadcast_REFRESH_FRIENDS:
          this.refreshFriendsStatus$.next();
          break;
        case this.WS_MESSAGES_TYPE.battle_OVERTIME:
          this.battleReadyOvertime$.next();
          break;
        case this.WS_MESSAGES_TYPE.battle_USER_ACTION:
          this.battleUserAction$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.admin_USERS_ONLINE:
          this.adminUsersOnline$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.admin_USER_BANNED:
          this.adminUserBanned$.next({ userId: data.userId, banned_until: data.banned_until });
          break;
        case this.WS_MESSAGES_TYPE.admin_USER_UNBANNED:
          this.adminUserUnbanned$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.admin_USER_DELETED:
          this.adminUserDeleted$.next(data);
          break;
        case this.WS_MESSAGES_TYPE.admin_BAN_EXPIRED:
          this.adminBanExpired$.next(data);
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
    this.send({ type: this.WS_MESSAGES_TYPE.USER_ADMIN_SUBSCRIBE, id, username });
  }

  sendHello(id: number, username: string): void {
    this.send({ type: this.WS_MESSAGES_TYPE.USER_SUBSCRIBE, id, username });
  }

  joinMatchmaking(userId: number, username: string, category: string, score: number): void {
    this.send({ type: this.WS_MESSAGES_TYPE.battle_JOIN_QUEUE, userId, username, category, score });
  }

  relaxMatchmaking(userId: number, username: string, category: string, score: number): void {
    this.send({ type: this.WS_MESSAGES_TYPE.battle_RELAX_QUEUE, userId, username, category, score });
  }

  cancelMatchmaking(username: string): void {
    this.send({ type: this.WS_MESSAGES_TYPE.battle_LEAVE_QUEUE, username });
  }

  sendReady(matchId: string, username: string): void {
    this.send({ type: this.WS_MESSAGES_TYPE.battle_READY, matchId, username });
  }

  sendDecline(matchId: string, username: string): void {
    this.send({ type: this.WS_MESSAGES_TYPE.battle_DECLINE, matchId, username });
  }

  sendEnterBattle(matchId: string, username: string) {
    this.send({ type: this.WS_MESSAGES_TYPE.battle_PLAYER_ENTERED_BATTLE, matchId, username });
  }

  sendBattleAnswer(matchId: string, username: string, answer: string, responseTime: number) {
    this.send({ type: this.WS_MESSAGES_TYPE.battle_ANSWER, matchId, username, answer, responseTime });
  }

  sendChatMessage(matchId: string, username: string, message: string, time: string) {
    this.send({ type: this.WS_MESSAGES_TYPE.battle_CHAT_MESSAGE, matchId, username, message, time });
  }

  sendBattleRequest(userId: number, friendId: number) {
    this.send({ type: this.WS_MESSAGES_TYPE.friends_BATTLE_REQUEST, userId, friendId });
  }

  sendBattleWithdraw(userId: number, friendId: number) {
    this.send({ type: this.WS_MESSAGES_TYPE.friends_BATTLE_WITHDRAW, userId, friendId });
  }

  sendBattleAccept(userId: number, friendId: number) {
    this.send({ type: this.WS_MESSAGES_TYPE.friends_BATTLE_ACCEPT, userId, friendId });
  }

  sendBattleDecline(userId: number, friendId: number) {
    this.send({ type: this.WS_MESSAGES_TYPE.friends_BATTLE_DECLINE, userId, friendId });
  }

  sendLeaveBattle(matchId: number, playerLeftId: number) {
    this.send({ type: this.WS_MESSAGES_TYPE.battle_LEAVE_BATTLE, matchId, playerLeftId });
  }

  sendStartOvertime(matchId: number, username: string) {
    this.send({ type: this.WS_MESSAGES_TYPE.battle_START_OVERTIME, matchId, username });
  }

  sendAction(matchId: number, userId: number, action: number, questionId: number) {
    this.send({ type: this.WS_MESSAGES_TYPE.battle_USER_ACTION, matchId, userId, action, questionId })
  }

  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

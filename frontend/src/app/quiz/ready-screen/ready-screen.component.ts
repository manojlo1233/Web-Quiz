import { Component, OnDestroy, OnInit } from '@angular/core';
import { WSMatchFoundMsg } from '../../shared/models/WSMatchFoundMsg';
import { UserService } from '../../services/shared/user.service';
import { MatchStateService } from '../../services/quiz/match-state.service';
import { User } from '../../shared/models/User';
import { interval, Subscription } from 'rxjs';
import { WebsocketService } from '../../services/quiz/websocket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ready-screen',
  templateUrl: './ready-screen.component.html',
  styleUrl: './ready-screen.component.css'
})
export class ReadyScreenComponent implements OnInit, OnDestroy {
  match: WSMatchFoundMsg;

  constructor(
    private userService: UserService,
    private matchStateService: MatchStateService,
    private wsService: WebsocketService,
    private router: Router
  ) { }

  user: User = new User();
  opponent: User = new User();

  remainingSeconds: number;
  private timer$: Subscription;
  userReady = false;
  opponentReady = false;

  ngOnInit(): void {
    this.match = this.matchStateService.getCurrentMatch();
    if (this.match) {
      console.log(this.match)
    }
    else {
      console.error('BIG ERROR')
      return;
    }

    const userId = parseInt(sessionStorage.getItem('userId'), 10);
    // --------- GET USER ---------
    this.userService.getUserById(userId).subscribe({
      next: (resp: any) => {
        this.user = resp;
      },
      error: (error: any) => {
        console.error(error)
      }
    })
    // --------- GET OPPONENT ---------
    this.userService.getUserByUsername(this.match.opponent).subscribe({
      next: (resp: any) => {
        this.opponent = resp;
      },
      error: (error: any) => {
        console.error(error)
      }
    })

    this.wsService.readyStatus$.subscribe(data => {
      if (data.username !== this.user.username) {
        this.opponentReady = true;
      }
    })

    this.wsService.matchStart$.subscribe(data => {
      this.router.navigate(['/quiz/battle']);
    })

    this.wsService.matchDeclined$.subscribe(matchId => {
      this.router.navigate(['/dashboard/main-page']);
    })
   
    console.log(this.match.startTimestamp);
    const timeLeft = this.match.startTimestamp - Date.now();
    this.remainingSeconds = Math.ceil(timeLeft / 1000);
    this.timer$ = interval(1000).subscribe(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        this.timer$.unsubscribe();
        this.wsService.sendReady(this.match.matchId.toString(), this.user.username);
      }
    })
  }

  onReadyClick(): void {
    this.userReady = true;
    this.wsService.sendReady(this.match.matchId.toString(), this.user.username);
  }

  onCancelClick(): void {
    this.wsService.sendDecline(this.match.matchId.toString(), this.user.username)
  }

  ngOnDestroy(): void {
    this.timer$.unsubscribe();
  }

}

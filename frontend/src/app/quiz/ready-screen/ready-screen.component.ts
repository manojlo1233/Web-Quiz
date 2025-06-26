import { Component, OnDestroy, OnInit } from '@angular/core';
import { WSMatchFoundMsg } from '../../shared/models/WSMatchFoundMsg';
import { UserService } from '../../services/shared/user.service';
import { MatchStateService } from '../../services/quiz/match-state.service';
import { User } from '../../shared/models/User';
import { interval, Subscription } from 'rxjs';
import { WebsocketService } from '../../services/quiz/websocket.service';
import { Router } from '@angular/router';
import { QuizService } from '../../services/shared/quiz.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-ready-screen',
  templateUrl: './ready-screen.component.html',
  styleUrl: './ready-screen.component.css',
  animations: [
    trigger('tipAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('500ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class ReadyScreenComponent implements OnInit, OnDestroy {
  match: WSMatchFoundMsg;

  constructor(
    private userService: UserService,
    private quizService: QuizService,
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

  // TIPS
  tips: any[] = [];
  currentTipIndex = 0;
  currentTip: string = '';

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

    const timeLeft = this.match.startTimestamp - Date.now();
    this.remainingSeconds = Math.ceil(timeLeft / 1000);
    this.timer$ = interval(1000).subscribe(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        this.timer$.unsubscribe();
        this.wsService.sendReady(this.match.matchId.toString(), this.user.username);
      }
    })

    // --------- GET RANDOM HINTS ---------
    this.quizService.getRandomHints().subscribe({
      next: (resp: any[]) => {
        this.tips = resp;
        console.log(this.tips);
        if (this.tips.length > 0) {
          this.currentTip = this.tips[0].text;
          setInterval(() => {
            this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length;
            this.currentTip = '';
            setTimeout(() => {
              this.currentTip = this.tips[this.currentTipIndex].text;
            }, 600); // omogucava animaciju leave + enter
          }, 10000)
        }
      },
      error: (error: any) => {

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

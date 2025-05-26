import { Component, OnInit } from '@angular/core';
import { WSMatchFoundMsg } from '../../shared/models/WSMatchFoundMsg';
import { UserService } from '../../services/shared/user.service';
import { MatchStateService } from '../../services/quiz/match-state.service';
import { User } from '../../shared/models/User';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ready-screen',
  templateUrl: './ready-screen.component.html',
  styleUrl: './ready-screen.component.css'
})
export class ReadyScreenComponent implements OnInit{
  match: WSMatchFoundMsg;

  constructor(
    private userService: UserService,
    private matchStateService: MatchStateService
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
  }
}

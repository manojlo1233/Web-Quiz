import { Component, OnInit } from '@angular/core';
import { MatchStateService } from '../../services/quiz/match-state.service';
import { WSMatchFoundMsg } from '../../shared/models/WSMatchFoundMsg';
import { WebsocketService } from '../../services/quiz/websocket.service';
import { User } from '../../shared/models/User';
import { UserService } from '../../services/shared/user.service';


@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
  styleUrl: './battle.component.css'
})
export class BattleComponent implements OnInit {

  match: WSMatchFoundMsg;

  constructor(
    private matchStateService: MatchStateService,
    private wsService: WebsocketService,
    private userService: UserService
  ) { }

  user: User = new User();

  ngOnInit(): void {
    this.match = this.matchStateService.getCurrentMatch();
    if (!this.match) {
      console.error('BIG ERROR')
      return;
    }
    const userId = parseInt(sessionStorage.getItem('userId'), 10);
    // --------- GET USER ---------
    this.userService.getUserById(userId).subscribe({
      next: (resp: any) => {
        this.user = resp;
        this.wsService.sendEnterBattle(this.match.matchId.toString(), this.user.username);
      },
      error: (error: any) => {
        console.error(error)
      }
    })

    this.wsService.newQuestion$.subscribe(resp => {
      console.log(resp);
    })

  }

}

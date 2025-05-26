import { Component, OnInit } from '@angular/core';
import { MatchStateService } from '../../services/quiz/match-state.service';
import { WSMatchFoundMsg } from '../../shared/models/WSMatchFoundMsg';


@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
  styleUrl: './battle.component.css'
})
export class BattleComponent implements OnInit {

  match: WSMatchFoundMsg;

  constructor(
    private matchStateService: MatchStateService
  ) {}

  ngOnInit(): void {
    this.match = this.matchStateService.getCurrentMatch();
    if (this.match) {

    }
    else {
      console.error('BIG ERROR')
    }
  }

}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BattleSummary } from '../../shared/models/Battle/BattleSummary';

@Component({
  selector: 'app-battle-summary',
  templateUrl: './battle-summary.component.html',
  styleUrl: './battle-summary.component.css'
})
export class BattleSummaryComponent implements OnInit {
  @Input('data') data: BattleSummary;
  @Output() closeEvent = new EventEmitter<void>();
  constructor() { }

  timeRemaining: number = 30;

  ngOnInit(): void {
    // SET TIME INTERVAL
    setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining === 0) {
        this.closeEvent.emit();
      }
    }, 1000)
  }

  goToMainPage() {
    this.closeEvent.emit();
  }
}

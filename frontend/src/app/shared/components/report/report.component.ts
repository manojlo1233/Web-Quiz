import {
  trigger,
  style,
  animate,
  transition
} from '@angular/animations';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  animations: [
    trigger('boxAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50%) translateY(10px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateX(-50%) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-50%) translateY(10px)' }))
      ])
    ])
  ]
})
export class ReportComponent {
  @Output() report: EventEmitter<any> = new EventEmitter();

  showReportBox = false;

  reasons = {
    cheating: false,
    abusive: false
  };

  toggleReportBox() {
    this.showReportBox = !this.showReportBox;
  }

  submitReport() {
    const selectedReasons = Object.entries(this.reasons)
      .filter(([_, checked]) => checked)
      .map(([reason]) => reason);

    
    this.report.emit(selectedReasons);

    // Resetuješ formu i sakriješ box
    this.reasons = { cheating: false, abusive: false };
    this.showReportBox = false;
  }
}
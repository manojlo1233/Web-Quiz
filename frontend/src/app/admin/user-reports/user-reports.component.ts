import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../shared/models/User/User';
import { UserService } from '../../services/shared/user.service';

@Component({
  selector: 'app-user-reports',
  templateUrl: './user-reports.component.html',
  styleUrl: './user-reports.component.css'
})
export class UserReportsComponent {
  @Input() user: User;
  @Output() close = new EventEmitter<void>();

  constructor(
    private userService: UserService
  ) { }

  reports: any[] = [];

  ngOnInit(): void {
    this.userService.getUserReports(this.user.id).subscribe({
      next: (resp: any) => {
        this.reports = resp;
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })
  }

  closeModal() {
    this.close.emit();
  }
}

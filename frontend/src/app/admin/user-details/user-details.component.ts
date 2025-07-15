import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../shared/models/User';
import { SnackBarService } from '../../services/shared/snack-bar.service';
import { ConfirmService } from '../../services/shared/confirm.service';
import { UserService } from '../../services/shared/user.service';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent {
  @Input() user: User;
  @Output() close = new EventEmitter<void>();

  constructor(
    private snackBarService: SnackBarService,
    private confirmService: ConfirmService
  ) { }

  reports: any[] = [];

  ngOnInit(): void {
  }

  closeModal() {
    this.close.emit();
  }

  
}

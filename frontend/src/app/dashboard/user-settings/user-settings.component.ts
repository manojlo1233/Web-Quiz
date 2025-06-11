import { Component, Input, OnInit } from '@angular/core';
import { User } from '../../shared/models/User';
import { UserSettingsService } from '../../services/dashboard/user-settings.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.css'
})
export class UserSettingsComponent implements OnInit {
  @Input() user: User;

  constructor(
    private userSettingsService: UserSettingsService
  ) { }

  ngOnInit(): void {
    console.log(this.user);
  }

  closeModal() {
    this.userSettingsService.clearContainer();
  }

  onSubmit() {
   /* this.authService.registerUser(this.firstName, this.secondName, this.email, this.username, this.password, this.country).subscribe((resp: any) => {
      if (resp.message) {
        this.snackBarService.showSnackBar(resp.message);
        this.reset();
      }
    })*/
  }
}

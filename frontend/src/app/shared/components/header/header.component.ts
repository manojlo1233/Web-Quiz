import { Component, EventEmitter, Output } from '@angular/core';
import { UserSettingsService } from '../../../services/dashboard/user-settings.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  constructor(
    private router: Router,
    private userSettingsService: UserSettingsService
  ) {}

  handleSettingsClick() {
    this.userSettingsService.showUserSettings();
  }

  handleLogoutClick() {
   this.router.navigate([''])
  }

}

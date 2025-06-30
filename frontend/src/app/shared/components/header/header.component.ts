import { Component, EventEmitter, Output } from '@angular/core';
import { UserSettingsService } from '../../../services/dashboard/user-settings.service';
import { Router } from '@angular/router';
import { WebsocketService } from '../../../services/quiz/websocket.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  constructor(
    private router: Router,
    private userSettingsService: UserSettingsService,
    private wsService: WebsocketService
  ) { }

  handleSettingsClick() {
    this.userSettingsService.showUserSettings();
  }

  handleLogoutClick() {
    this.wsService.close();
    this.router.navigate([''])
  }

  handleNotificationClick() {

  }
}

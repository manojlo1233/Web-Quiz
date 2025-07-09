import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserSettingsService } from '../../../services/dashboard/user-settings.service';
import { Router } from '@angular/router';
import { WebsocketService } from '../../../services/quiz/websocket.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Input() userRole: number;
  @Output() handleIconClick = new EventEmitter<string>();
  constructor(
    private router: Router,
    private userSettingsService: UserSettingsService,
    private wsService: WebsocketService
  ) { }

  handleNotificationClick() {
    this.handleIconClick.emit('notification');
  }

  handleAdminSettingsClick() {
    this.handleIconClick.emit('admin-settings')
  }

  handleSettingsClick() {
    this.handleIconClick.emit('settings');
  }

  handleLogoutClick() {
    this.wsService.close();
    this.router.navigate([''])
  }
}

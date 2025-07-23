import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

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
    private authService: AuthService
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
    this.authService.logoutUser().subscribe(res => {
      sessionStorage.removeItem('sessionToken');
      this.router.navigate([''])
    })
  }
}

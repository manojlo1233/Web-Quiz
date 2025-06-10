import { Component } from '@angular/core';
import { NotificationService } from '../../../services/shared/notification.service';

@Component({
  selector: 'app-notification-container',
  templateUrl: './notification-container.component.html',
  styleUrl: './notification-container.component.css'
})
export class NotificationContainerComponent {
  notifications: string[] = [];

  constructor(private notificationService: NotificationService) {
    this.notificationService.notifications$.subscribe(message => {
      this.notifications.push(message);
      setTimeout(() => this.notifications.shift(), 5000);
    });
  }
}

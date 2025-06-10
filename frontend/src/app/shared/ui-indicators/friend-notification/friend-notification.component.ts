import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-friend-notification',
  templateUrl: './friend-notification.component.html',
  styleUrl: './friend-notification.component.css'
})
export class FriendNotificationComponent {
  @Input() message!: string;
  @Input() index!: number;

  get transformStyle() {
    return `translateX(-${this.index * 210}px)`; // 200px sirina + 10px razmak
  }
}

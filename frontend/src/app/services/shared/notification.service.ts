import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private _notifications = new Subject<string>();
  notifications$ = this._notifications.asObservable();

  showNotification(message: string) {
    this._notifications.next(message);
  }
}

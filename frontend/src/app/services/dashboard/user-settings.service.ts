import { Injectable, ViewContainerRef } from '@angular/core';
import { UserSettingsComponent } from '../../dashboard/user-settings/user-settings.component';
import { User } from '../../shared/models/User';

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {

  private container: ViewContainerRef = null;
  private user: User = null;

  constructor() { }

  setContainer(container: ViewContainerRef) {
    if (!this.container) {
      this.container = container;
    }
  }

  clearContainer() {
    if (this.container) {
      this.container.clear();
    }
  }

  setUser(user: User) {
    this.user = user;
  }

  showUserSettings() {
    if (!this.container) return;
    const ref = this.container.createComponent(UserSettingsComponent);
    ref.setInput('user', this.user);
  }
}

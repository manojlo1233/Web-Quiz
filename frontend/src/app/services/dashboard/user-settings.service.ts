import { Injectable, ViewContainerRef } from '@angular/core';
import { UserSettingsComponent } from '../../dashboard/user-settings/user-settings.component';
import { User } from '../../shared/models/User/User';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../shared/url.service';

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  url: string;
  constructor(
    private http: HttpClient,
    private urlService: UrlService
  ) {
    this.url = `${urlService.url}/users`
  }

  updateUserSettingsById(userId: number, firstName: string, lastName: string, username: string, email: string, country: string, receive_updates: boolean) {
    const body = {
      userId,
      firstName,
      lastName,
      username,
      email,
      country,
      receive_updates
    }
    return this.http.post(`${this.url}/updateUserSettingsById`, body);
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UrlService } from '../shared/url.service';
import { WebsocketService } from '../quiz/websocket.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private url: string;
  constructor(
    private http: HttpClient,
    private urlService: UrlService,
    private wsService: WebsocketService
  ) {
    this.url = `${urlService.url}/users`;
  }

  loginUser(userNameOrEmail: string, password: string): Observable<any> {
    const body = {
      userNameOrEmail,
      password
    }
    return this.http.post(`${this.url}/loginUser`, body);
  }

  registerUser(firstName: string, lastName: string, email: string, userName: string, password: string, country: string, notification: boolean): Observable<any> {
    const body = {
      firstName,
      lastName,
      email,
      userName,
      password,
      country,
      time: Date.now(),
      notification
    }
    return this.http.post(`${this.url}/registerUser`, body);
  }

  logoutUser() {
    this.wsService.close();
    return this.http.post(`${this.url}/logoutUser`, {});
  }

  requestPasswordReset(email) {
    return this.http.post(`${this.url}/requestPasswordReset`, { email })
  }

  resetPassword(token, password) {
    return this.http.post(`${this.url}/resetPassword`, { token, password });
  }

}

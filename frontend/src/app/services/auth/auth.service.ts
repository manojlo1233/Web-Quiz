import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private url: string = 'http://localhost:3000/api/users'

  constructor(
    private http: HttpClient
  ) { }

  loginUser(userNameOrEmail: string, password: string): Observable<any> {
    const body = {
      userNameOrEmail,
      password
    }
    return this.http.post(`${this.url}/loginUser`, body);
  }

  registerUser(firstName: string, lastName: string, email: string, userName: string, password: string, country: string): Observable<any> {
    const body = {
      firstName,
      lastName,
      email,
      userName,
      password,
      country,
      time: Date.now()
    }
    return this.http.post(`${this.url}/registerUser`, body);
  }

  requestPasswordReset(email) {
    return this.http.post(`${this.url}/requestPasswordReset`, { email })
  }

  resetPassword(token, password) {
    return this.http.post(`${this.url}/resetPassword`, {token, password});
  }

}

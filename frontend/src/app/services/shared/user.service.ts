import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UrlService } from './url.service';
import { User } from '../../shared/models/User';
import { Router } from '@angular/router';
import { UserSettingsService } from '../dashboard/user-settings.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private url: string;

  constructor(
    private http: HttpClient,
    private router: Router,
    private urlService: UrlService,
    private userSettingsService: UserSettingsService
  ) {
    this.url = `${urlService.url}/users`
  }

  mainUser: User = null;

  loadUser(usernameOrEmail: string) {
    this.http.get(`${this.url}/getUserByUsernameOrEmail/${usernameOrEmail}`).subscribe({
      next: (user: User) => {
        this.mainUser = user;
        this.userSettingsService.setUser(this.mainUser);
        this.router.navigate(['dashboard/main-page']);
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })
  }

  getUserById(id: number) {
    return this.http.get(`${this.url}/getUserById/${id}`);
  }

  getUserByUsername(username: string) {
    return this.http.get(`${this.url}/getUserByUsername/${username}`);
  }

  getUsersByUsername(searchUsername: string, userUsername: string) {
    const body = {
      searchUsername: searchUsername,
      userUsername: userUsername
    }
    return this.http.post(`${this.url}/getUsersByUsername`, body);
  }

  getUserStatisticsById(id: number) {
    return this.http.get(`${this.url}/getUserStatisticsById/${id}`);
  }

  getUserPlayHistoryById(id: number) {
    return this.http.get(`${this.url}/getUserPlayHistoryById/${id}`);
  }

  getUserQuizQuestionsById(userId: number, quizId: number) {
    return this.http.get(`${this.url}/getUserQuizQuestionsById/${userId}/${quizId}`)
  }

  getLeaderBoard() {
    return this.http.get(`${this.url}/getLeaderBoard`)
  }
}

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
    private urlService: UrlService,
  ) {
    this.url = `${urlService.url}/users`
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

  getUserQuizDetails(quizId: number) {
    return this.http.get(`${this.url}/getUserQuizDetails/${quizId}`)
  }

  getLeaderBoard() {
    return this.http.get(`${this.url}/getLeaderBoard`)
  }

  updateUserAvatar(userId: number, avatar: string) {
    const body = {
      userId,
      avatar
    }
    return this.http.patch(`${this.url}/updateUserAvatar`, body);
  }
}

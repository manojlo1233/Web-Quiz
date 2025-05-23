import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UrlService } from './url.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private url: string;

  constructor(
    private http: HttpClient,
    private urlService: UrlService
  ) {
    this.url = `${urlService.url}/users`
  }

  getUserById(id: number) {
    return this.http.get(`${this.url}/getUserById/${id}`);
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
}

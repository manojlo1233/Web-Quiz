import { Injectable } from '@angular/core';
import { UrlService } from './url.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class QuizService {

  url: string;
  constructor(
    private http: HttpClient,
    private urlService: UrlService
  ) {
    this.url = `${urlService.url}/quiz`;
  }

  getRandomHints() {
    return this.http.get(`${this.url}/getRandomHints`);
  }

  reportUser(userIdReportFrom: number, userIdReportTo: number, reasons: string[], quizId: number) {
    const body = {
      userIdReportTo,
      userIdReportFrom,
      reasons,
      quizId
    }
    return this.http.post(`${this.url}/reportUser`, body);
  }
}

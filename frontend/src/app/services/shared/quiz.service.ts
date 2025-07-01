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
}

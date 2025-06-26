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

  difficultyLabels = ['Easy', 'Medium', 'Hard']
  difficultyColors = ['green', 'orange', 'red']

  getDifficultyLabel(level: number) {
    return this.difficultyLabels[level] || 'Unknown';
  }

  getDifficultyColor(level: number) {
    return this.difficultyColors[level] || 'white';
  }

  getRandomHints() {
    return this.http.get(`${this.url}/getRandomHints`);
  }
}

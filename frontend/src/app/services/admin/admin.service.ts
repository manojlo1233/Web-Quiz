import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UrlService } from '../shared/url.service';
import { QuizAnswer } from '../../shared/models/Quiz/QuizAnswer';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  url: string = null;

  constructor(
    private http: HttpClient,
    private urlService: UrlService
  ) { 
    this.url = `${urlService.url}/admin`;
  }

  getAllUsers() {
    return this.http.get(`${this.url}/getAllUsers`);
  }
  
  addQuestion(questionText: string, questionDescription: string, categoryId: number, answers: QuizAnswer[]) {
    const body = {
      questionText,
      questionDescription,
      categoryId,
      answers
    }
    return this.http.post(`${this.url}/addQuestion`, body)
  }

  deleteUser(userId: number) {
    return this.http.delete(`${this.url}/deleteUser/${userId}`);
  }

}

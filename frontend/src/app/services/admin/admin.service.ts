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

  getAllQuestions() {
    return this.http.get(`${this.url}/getAllQuestions`);
  }

  addQuestion(questionText: string, questionDescription: string, categoryId: number, difficulty: number, answers: QuizAnswer[]) {
    const body = {
      questionText,
      questionDescription,
      categoryId,
      difficulty,
      answers
    }
    return this.http.post(`${this.url}/addQuestion`, body)
  }

  updateQuestion(questionId: number, questionText: string, questionDescription: string, categoryId: number, difficulty: number, answers: QuizAnswer[]) {
    const body = {
      questionId,
      questionText,
      questionDescription,
      categoryId,
      difficulty,
      answers
    }
    return this.http.post(`${this.url}/updateQuestion`, body)
  }

  deleteQuestion(questionId: number) {
    return this.http.delete(`${this.url}/deleteQuestion/${questionId}`);
  }

  deleteUser(userId: number) {
    return this.http.delete(`${this.url}/deleteUser/${userId}`);
  }

  banUser(userId: number, date: string) {
    const data = {
      userId,
      date
    }
    return this.http.post(`${this.url}/banUser`, data);
  }

  unbanUser(userId: number) {
    const data = {
      userId
    }
    return this.http.post(`${this.url}/unbanUser`, data);
  }

  addCategory(categoryName: string) {
    const data = {
      categoryName
    }
    return this.http.post(`${this.url}/addCategory`, data);
  }

  deleteCategory(categoryId: number) {
    return this.http.delete(`${this.url}/deleteCategory/${categoryId}`);
  }

}

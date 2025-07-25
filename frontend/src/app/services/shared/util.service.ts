import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UrlService } from './url.service';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor(
    private http: HttpClient,
    private urlService: UrlService
  ) {
    this.url = `${urlService.url}/util`
  }

  url: string = null;

  showMessage: string = '';

  formatDurationToMinSecFromSec(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  formatPercentTwoFixed(num1: number, num2: number): string {
    return (num1 / num2 * 100).toFixed(2);
  }

  getAvailableAvatars() {
    return this.http.get(`${this.url}/getAvailableAvatars`);
  }

  getAllCategories() {
    return this.http.get(`${this.url}/getAllCategories`);
  }

  getLeaderBoard(category: string) {
    return this.http.get(`${this.url}/getLeaderBoard/${category}`)
  }

  getAllRanks() {
    return this.http.get(`${this.urlService.staticUrl}/ranking/ranks.json`);
  }

  setShowMessage(message: string): void {
    this.showMessage = message;
  }

  getShowMessage(): string {
    return this.showMessage;
  }
}

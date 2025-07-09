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

  allCategories: string[] = ['General', 'History', 'Science'];

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
}

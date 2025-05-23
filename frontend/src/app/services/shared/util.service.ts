import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor() { }

  formatDurationToMinSecFromSec(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  formatPercentTwoFixed(num1: number, num2: number): string {
    return (num1 / num2 * 100).toFixed(2);
  }
}

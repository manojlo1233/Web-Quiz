import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QuizService {

  constructor() { }

  difficultyLabels = ['Easy', 'Medium', 'Hard']
  difficultyColors = ['green', 'orange', 'red']

  getDifficultyLabel(level: number) {
    return this.difficultyLabels[level] || 'Unknown';
  }

  getDifficultyColor(level: number) {
    return this.difficultyColors[level] || 'white';
  }
}

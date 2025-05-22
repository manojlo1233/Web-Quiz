import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { User } from '../../shared/models/User';
import { UserService } from '../../services/shared/user.service';
import { Statistic } from '../../shared/models/Statistic';
import { QuizPlayed } from '../../shared/models/QuizPlayed';
import { QuizService } from '../../services/shared/quiz.service';
import { UtilService } from '../../services/shared/util.service';
import { QuizDetailsComponent } from '../quiz-details/quiz-details.component';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit {
  @ViewChild('displayQuizQuestionsContainer', { read: ViewContainerRef }) displayQuizQuestionsContainer!: ViewContainerRef;

  constructor(
    private userService: UserService,
    private quizService: QuizService,
    private utilService: UtilService
  ) { }

  user: User = new User();
  userStatistic: Statistic = new Statistic();
  userPlayHistory: QuizPlayed[] = [];

  ngOnInit(): void {
    const userId = parseInt(sessionStorage.getItem('userId'), 10);
    // --------- GET USER ---------
    this.userService.getUserById(userId).subscribe({
      next: (resp: any) => {
        this.user = resp;
      },
      error: (error: any) => {
        console.error(error)
      }
    })
    // --------- GET USER STATISTICS---------
    this.userService.getUserStatisticsById(userId).subscribe({
      next: (resp: any) => {
        this.userStatistic = resp;
      },
      error: (error: any) => {
        console.error(error)
      }
    })
    // --------- GET USER PLAY HISTORY ---------
    this.userService.getUserPlayHistoryById(userId).subscribe({
      next: (resp: any) => {
        const ret: any = (resp as any[]).map((val) => {
          const start = new Date(val.start).getTime();
          const end = new Date(val.end).getTime();
          const duration = (end - start) / 1000;
          return {
            ...val,
            start,
            end,
            duration
          }
        });
        this.userPlayHistory = ret;
      },
      error: (error: any) => {
        console.error(error)
      }
    })
  }

  formatDuration(seconds: number): string {
    return this.utilService.formatDurationToMinSecFromSec(seconds);
  }

  showDetails(item: QuizPlayed) {
    this.userService.getUserQuizQuestionsById(item.user_id, item.quiz_id).subscribe({
      next: (resp: any) => {
        this.displayQuizQuestionsContainer.clear();
        const componentRef = this.displayQuizQuestionsContainer.createComponent(QuizDetailsComponent);
        componentRef.setInput('selectedQuizPlayed', item);
        componentRef.setInput('selectedQuizQuestions', resp)
        componentRef.instance.closed.subscribe(() => {
          componentRef.destroy();
        })
      },
      error: (error: any) => {
        console.error(error)
      }
    })
  }

  getDifficultyLabel(level: number) {
    return this.quizService.getDifficultyLabel(level);
  }

  getDifficultyColor(level: number) {
    return this.quizService.getDifficultyColor(level);
  }
}

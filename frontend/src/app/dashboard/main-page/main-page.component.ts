import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { User } from '../../shared/models/User';
import { UserService } from '../../services/shared/user.service';
import { Statistic } from '../../shared/models/Statistic';
import { QuizPlayed } from '../../shared/models/QuizPlayed';
import { QuizService } from '../../services/shared/quiz.service';
import { UtilService } from '../../services/shared/util.service';
import { QuizDetailsComponent } from '../quiz-details/quiz-details.component';
import { WebsocketService } from '../../services/quiz/websocket.service';
import { Subscription } from 'rxjs';
import { WsMessage } from '../../shared/models/WsMessage';
import { Router } from '@angular/router';
import { MatchStateService } from '../../services/quiz/match-state.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit, OnDestroy {
  @ViewChild('displayQuizQuestionsContainer', { read: ViewContainerRef }) displayQuizQuestionsContainer!: ViewContainerRef;

  constructor(
    private router: Router,
    private userService: UserService,
    private quizService: QuizService,
    private utilService: UtilService,
    private wsService: WebsocketService,
    private matchStateService: MatchStateService
  ) {
    this.errorSub = this.wsService.error$.subscribe((msg) => {
      this.errorMessage = msg;
      this.matchmakingLbl = 'Battle'
      this.isSearching = false;
      console.error('Error: ', msg)
    })
    this.startQuizSub = this.wsService.startQuiz$.subscribe((resp: WsMessage) => {
      this.isSearching = false;
      this.matchmakingLbl = 'Battle'
      this.handleWsMessage(resp);
    })
  }

  user: User = new User();
  userStatistic: Statistic = new Statistic();
  userPlayHistory: QuizPlayed[] = [];

  // SUBSCRIPTIONS
  private errorSub: Subscription;
  private startQuizSub: Subscription;

  // MATCHMAKING
  matchmakingLbl: string = 'Battle'
  isSearching: boolean = false;

  // MATCHMAKING TIMER
  secondsElapsed = 0;
  timerInterval: any;
  formattedTime = '00:00';

  // SOCKET ERROR
  
  errorMessage: string | null = null;

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
    // --------- INITIALIZE WEBSOCKET CONNECTION ---------
    this.wsService.connect();
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

  onBattleClick() {
    if (!this.isSearching) {
      this.matchmakingLbl = 'Cancel'
      this.isSearching = true;
      this.secondsElapsed = 0;
      this.updateFormattedTime();
      this.timerInterval = setInterval(() => {
        this.secondsElapsed++;
        this.updateFormattedTime();
      }, 1000)
      this.wsService.joinMatchmaking(this.user.username);
    }
    else {
      this.matchmakingLbl = 'Battle'
      this.isSearching = false;
      clearInterval(this.timerInterval);
    }
  }

  updateFormattedTime() {
    const minutes = Math.floor(this.secondsElapsed / 60);
    const seconds = this.secondsElapsed % 60;
    this.formattedTime =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  handleWsMessage(msg: WsMessage) {
    if (msg.type === 'start-quiz') {
      this.matchStateService.setCurrentMatch(msg);
      this.router.navigate(['/quiz/battle'])
    }
  }

  ngOnDestroy(): void {
    this.errorSub.unsubscribe();
  }
}

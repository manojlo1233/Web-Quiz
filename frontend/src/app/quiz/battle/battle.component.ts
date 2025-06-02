import { Component, OnInit } from '@angular/core';
import { MatchStateService } from '../../services/quiz/match-state.service';
import { WSMatchFoundMsg } from '../../shared/models/WSMatchFoundMsg';
import { WebsocketService } from '../../services/quiz/websocket.service';
import { User } from '../../shared/models/User';
import { UserService } from '../../services/shared/user.service';
import { QuizQuestion } from '../../shared/models/Quiz/QuizQuestion';
import { QuizAnswer } from '../../shared/models/Quiz/QuizAnswer';


@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
  styleUrl: './battle.component.css'
})
export class BattleComponent implements OnInit {

  match: WSMatchFoundMsg;

  constructor(
    private matchStateService: MatchStateService,
    private wsService: WebsocketService,
    private userService: UserService
  ) { }
  // USERS
  user: User = new User();
  opponent: User = new User();

  // QUESTION TIMER
  totalTime: number = 15;
  remainingTime: number = 15;
  timerInterval;
  // QUESTION
  question: QuizQuestion = new QuizQuestion();
  // ASNWERS
  selectedAnswer: any = null;
  // ANSWER SUMMARY
  answerSummaryPhase: boolean = false;
  userAnswerIndex: number = -1;
  opponentAnswerIndex: number = -1;
  correctAnswerIndex: number = -1;

  ngOnInit(): void {
    this.match = this.matchStateService.getCurrentMatch();
    if (!this.match) {
      console.error('BIG ERROR')
      return;
    }
    // SUBSCRIBE TO QUESTIONS
    this.wsService.newQuestion$.subscribe(resp => {
      this.answerSummaryPhase = false;
      this.userAnswerIndex = -1;
      this.opponentAnswerIndex = -1;
      this.correctAnswerIndex = -1;
      this.question = resp.question;
      this.init();
    })

    // SUBSCRIBE TO ANSWER SUMMARY
    this.wsService.answerSummary$.subscribe(resp => {
      this.answerSummaryPhase = true;
      this.selectedAnswer = null;
      this.initTimerIncrease();
      this.getAnswerIndices(resp);
    })

    const userId = parseInt(sessionStorage.getItem('userId'), 10);
    // --------- GET USER ---------
    this.userService.getUserById(userId).subscribe({
      next: (resp: any) => {
        this.user = resp;
        this.wsService.sendEnterBattle(this.match.matchId.toString(), this.user.username);
      },
      error: (error: any) => {
        console.error(error)
      }
    })
    // --------- GET OPPONENT ---------
    this.userService.getUserByUsername(this.match.opponent).subscribe({
      next: (resp: any) => {
        this.opponent = resp;
      },
      error: (error: any) => {
        console.error(error)
      }
    })
  }

  // INIT
  init() {
    this.initTimerDecrease();
    this.resetAnswer();
  }

  initTimerDecrease() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.totalTime = 10;
    this.remainingTime = 10;
    this.timerInterval = setInterval(() => {
      this.remainingTime--;
      if (this.remainingTime === 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000)
  }

  initTimerIncrease() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.totalTime = 4;
    this.remainingTime = 0;
    this.timerInterval = setInterval(() => {
      if (this.remainingTime === this.totalTime) {
        clearInterval(this.timerInterval);
      }
      this.remainingTime++;
    }, 1000)
  }

  getAnswerIndices(resp: any) {
    this.userAnswerIndex = this.question.answers.findIndex(a => a.text === resp.yourAnswer);
    this.opponentAnswerIndex = this.question.answers.findIndex(a => a.text === resp.opponentAnswer);
    this.correctAnswerIndex = this.question.answers.findIndex(a => a.text === resp.correctAnswer);
  }

  resetAnswer() {
    this.selectedAnswer = null;
  }

  handleAnswerClick(answer: QuizAnswer) {
    if (this.selectedAnswer) return;
    this.selectedAnswer = answer;
    this.wsService.sendBattleAnswer(this.match.matchId.toString(), this.user.username, answer.text);
  }
}

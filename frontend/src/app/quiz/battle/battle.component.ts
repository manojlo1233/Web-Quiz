import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatchStateService } from '../../services/quiz/match-state.service';
import { WSMatchFoundMsg } from '../../shared/models/WSMatchFoundMsg';
import { WebsocketService } from '../../services/quiz/websocket.service';
import { User } from '../../shared/models/User';
import { UserService } from '../../services/shared/user.service';
import { QuizQuestion } from '../../shared/models/Quiz/QuizQuestion';
import { QuizAnswer } from '../../shared/models/Quiz/QuizAnswer';
import { ChatMessage } from '../../shared/models/ChatMessage';
import { BattleSummary } from '../../shared/models/Battle/BattleSummary';
import { Router } from '@angular/router';
import { AnswerSummary } from '../../shared/models/Battle/AnswerSummary';

import * as leoProfanity from 'leo-profanity';
import { QuizService } from '../../services/shared/quiz.service';
import { SnackBarService } from '../../services/shared/snack-bar.service';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
  styleUrl: './battle.component.css'
})
export class BattleComponent implements OnInit {
  @ViewChild('chatBox') chatBox!: ElementRef;

  match: WSMatchFoundMsg;

  constructor(
    private matchStateService: MatchStateService,
    private wsService: WebsocketService,
    private userService: UserService,
    private router: Router,
    private quizService: QuizService,
    private snackBarService: SnackBarService
  ) { }
  // USERS
  user: User = new User();
  opponent: User = new User();

  // QUESTION TIMER
  totalTime: number = 15;
  remainingTime: number = 15;
  timerInterval;
  timerStartTime;
  // QUESTION
  question: QuizQuestion = new QuizQuestion();
  // ASNWERS
  selectedAnswer: any = null;
  // ANSWER SUMMARY
  answerSummaryPhase: boolean = false;
  userAnswerIndex: number = -1;
  opponentAnswerIndex: number = -1;
  correctAnswerIndex: number = -1;
  userPoints: number = 0;
  userDeltaPoints: number = 0;
  opponentPoints: number = 0;
  opponentDeltaPoints: number = 0;
  //CHAT
  messageText: string = "";
  chatMessages: ChatMessage[] = [];
  muteActive: boolean = false;
  chatDebouncerActive: boolean = false;
  // BATTLE SUMMARY
  showBattleSummary: boolean = false;
  battleSummaryData: BattleSummary = null;
  // LEAVE
  reallyLeave: boolean = false;
  // OVERTIME
  showOvertimeMessage: boolean = false;
  overtimeSecondsRemaining: number = 10;
  overtimePhase: boolean = false;

  // ACTIONS
  ACTION_TYPE = {
    HIDE_2_WRONG_ANSWERS: 0,
    HALF_THE_TIME_OPPONENT: 1,
    DOUBLE_NEGATIVE_POINTS_OPPONENT: 2,
  }
  actionNames: string[] = ['50/50', 'Half the time', '-2x'];
  actionsUsed: boolean[] = [false, false, false];
  actionUsed: boolean = false;
  opponentAction: number = -1;

  ngOnInit(): void {
    this.match = this.matchStateService.getCurrentMatch();
    if (!this.match) {
      console.error('BIG ERROR')
      return;
    }
    // SUBSCRIBE TO QUESTIONS
    this.wsService.newQuestion$.subscribe(resp => {
      this.resetParameters();
      this.question = resp.question;
      this.init();
    })

    // SUBSCRIBE TO ANSWER SUMMARY
    this.wsService.answerSummary$.subscribe((resp: AnswerSummary) => {
      console.log(resp);
      this.answerSummaryPhase = true;
      this.selectedAnswer = null;
      this.initTimerIncrease();
      this.getAnswerIndices(resp);
      this.initDeltaPoints(resp.yourDeltaPoints, resp.opponentDeltaPoints);
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
    // --------- CHAT SUBSCRIBTION ---------
    this.wsService.chatMessage$.subscribe((data: any) => {
      if (this.muteActive && data.username !== this.user.username) return;
      let tmp: ChatMessage = new ChatMessage();
      tmp.message = data.message;
      tmp.time = data.time;
      tmp.username = data.username;
      this.chatMessages.unshift(tmp);
    })
    // --------- BATTLE SUMMARY ---------
    this.wsService.matchFinished$.subscribe((data: any) => {
      this.showBattleSummary = true;
      this.battleSummaryData = new BattleSummary();
      this.battleSummaryData = { ...data };
    })

    // --------- GET READY FOR OVERTIME ---------
    this.wsService.battleReadyOvertime$.subscribe(() => {
      this.showOvertimeMessage = true;
      setInterval(() => {
        this.overtimeSecondsRemaining--;
        if (this.overtimeSecondsRemaining === 0) {
          this.wsService.sendStartOvertime(this.match.matchId, this.user.username);
          this.showOvertimeMessage = false;
          this.overtimePhase = true;
        }
      }, 1000)
    })

    // --------- OPPONENT ACTION ---------
    this.wsService.battleUserAction$.subscribe((resp: any) => {
      this.opponentAction = resp.action;
      if (this.opponentAction === this.ACTION_TYPE.HALF_THE_TIME_OPPONENT) {
        this.remainingTime = Math.floor(this.remainingTime / 2);
      }
    })
  }

  resetParameters() {
    this.actionUsed = false;
    this.opponentAction = -1;
    this.answerSummaryPhase = false;
    this.userAnswerIndex = -1;
    this.opponentAnswerIndex = -1;
    this.correctAnswerIndex = -1;
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
    this.timerStartTime = performance.now();
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

  initDeltaPoints(userDeltaPoints: number, opponentDeltaPoints: number) {
    this.userDeltaPoints = userDeltaPoints;
    this.opponentDeltaPoints = opponentDeltaPoints;
    setTimeout(() => {
      this.userPoints += this.userDeltaPoints;
      this.opponentPoints += this.opponentDeltaPoints;
      this.userDeltaPoints = 0;
      this.opponentDeltaPoints = 0;
    }, 4000)
  }

  getAnswerIndices(resp: AnswerSummary) {
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
    const currentTime = performance.now();
    const elapsed = (currentTime - this.timerStartTime) / 1000;
    this.wsService.sendBattleAnswer(this.match.matchId.toString(), this.user.username, answer.text, parseFloat(elapsed.toFixed(2)));
  }

  sendMessage() {
    if (this.messageText === '' || this.messageText.trim() === '' || this.chatDebouncerActive) return;
    this.chatDebouncerActive = true;
    const cleanedMessage = leoProfanity.clean(this.messageText);
    this.wsService.sendChatMessage(this.match.matchId.toString(), this.user.username, cleanedMessage, new Date().toLocaleString("en-GB"));
    this.messageText = '';
    setTimeout(() => {
      this.chatDebouncerActive = false;
    }, 500)
  }

  checkIfUser(username: string): string {
    return this.user.username === username ? '0' : 'auto';
  }

  getIcon() {
    if (this.muteActive) {
      return '';
    }
    else {
      return '/assets/svg/icon_munute.svg';
    }
  }

  goToMainPage() {
    this.router.navigate(['dashboard/main-page']);
  }

  handleLeaveClick() {
    if (!this.reallyLeave) {
      this.reallyLeave = true;
      setTimeout(() => {
        this.reallyLeave = false;
      }, 5000)
      return;
    }
    else {
      this.wsService.sendLeaveBattle(this.match.matchId, this.user.id);
    }
  }

  handleReport(reasons: any[]) {
    this.quizService.reportUser(this.user.id, this.opponent.id, reasons, this.match.matchId).subscribe({
      next: (resp: any) => {
        this.snackBarService.showSnackBar(resp.message);
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })
  }

  handleActionButtonClick(type: number) {
    this.actionUsed = true;
    this.actionsUsed[type] = true;
    switch (type) {
      case this.ACTION_TYPE.HIDE_2_WRONG_ANSWERS:
        const incorrectAnswers = this.question.answers.filter(a => !a.isCorrect);
        for (let i = incorrectAnswers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [incorrectAnswers[i], incorrectAnswers[j]] = [incorrectAnswers[j], incorrectAnswers[i]];
        }
        incorrectAnswers.slice(0, 2).forEach(a => {
          a.isDisabled = true;
        });
        break;
    }

    this.wsService.sendAction(this.match.matchId, this.user.id, type, this.question.id);
  }

  getActionName(type: number): string {
    return this.actionNames[type];
  }

}

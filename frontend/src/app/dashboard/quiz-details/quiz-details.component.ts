import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { QuizPlayed } from '../../shared/models/Quiz/QuizPlayed';
import { QuizDetailsQuestion } from '../../shared/models/Quiz/QuizDetailsQuestion';
import { QuizService } from '../../services/shared/quiz.service';
import { UtilService } from '../../services/shared/util.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-quiz-details',
  templateUrl: './quiz-details.component.html',
  styleUrl: './quiz-details.component.css',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        padding: '0px',
        marginTop: '0',
        borderWidth: '0'
      })),
      state('expanded', style({
        height: '150px',
        opacity: 1,
        padding: '5px 0',
        marginTop: '5px',
        borderWidth: '1px'
      })),
      transition('collapsed <=> expanded', [
        animate('250ms ease-in-out')
      ])
    ])
  ]
})
export class QuizDetailsComponent implements OnChanges {
  @ViewChild('questionExpand') questionExpand!: ElementRef;
  @Input() selectedQuizPlayed: QuizPlayed;
  @Input() selectedQuizQuestions: QuizDetailsQuestion[];

  userQuestions: QuizDetailsQuestion[];
  opponentQuestions: QuizDetailsQuestion[];

  @Output() closed = new EventEmitter<void>();

  constructor(
    private renderer: Renderer2,
    private utilService: UtilService
  ) {

  }

  // Question Description
  ARROW_DIRECTION = {
    UP: '/assets/svg/icon_up_arrow.svg',
    DOWN: '/assets/svg/icon_down_arrow.svg'
  }

  descArrowSrc = this.ARROW_DIRECTION.DOWN

  userCorrectAns: number = 0;
  userTotalNumOfAns: number = 0;
  userAnsPercent: string = '';

  opponentCorrectAns: number = 0;
  opponentTotalNumOfAns: number = 0;
  opponentAnsPercent: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    this.selectedQuizQuestions = this.selectedQuizQuestions.map(q => ({
      ...q,
      isExpanded: false
    }));
    this.userQuestions = this.selectedQuizQuestions.filter(q => q.user_id === this.selectedQuizPlayed.user_id);
    this.opponentQuestions = this.selectedQuizQuestions.filter(q => q.user_id !== this.selectedQuizPlayed.user_id);

    this.userTotalNumOfAns = this.userQuestions.length;
    this.userCorrectAns = this.userQuestions.filter(q => q.correct_answer_text === q.user_answer_text).length;
    this.userAnsPercent = this.utilService.formatPercentTwoFixed(this.userCorrectAns, this.userTotalNumOfAns);

    this.opponentTotalNumOfAns = this.opponentQuestions.length;
    this.opponentCorrectAns = this.opponentQuestions.filter(q => q.correct_answer_text === q.user_answer_text).length;
    this.opponentAnsPercent = this.utilService.formatPercentTwoFixed(this.opponentCorrectAns, this.opponentTotalNumOfAns);
  }

  formatDuration(seconds: number): string {
    return this.utilService.formatDurationToMinSecFromSec(seconds);
  }

  close() {
    this.closed.emit();
  }

  handleDescription() {
    if (this.descArrowSrc === this.ARROW_DIRECTION.DOWN) {
      this.descArrowSrc = this.ARROW_DIRECTION.UP;
      this.renderer.setStyle(this.questionExpand.nativeElement, 'height', '300px');
    }
    else {
      this.descArrowSrc = this.ARROW_DIRECTION.DOWN;
      this.renderer.setStyle(this.questionExpand.nativeElement, 'height', '0');
    }
  }

  getBattleOutcome() {
    if (this.selectedQuizPlayed.player_left_id === this.selectedQuizPlayed.user_id) {
      return 'LEFT';
    }
    else {
      return this.selectedQuizPlayed.user_id === this.selectedQuizPlayed.winner_id? 'WIN': 'LOSE';
    }
  }

}

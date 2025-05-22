import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { QuizPlayed } from '../../shared/models/QuizPlayed';
import { QuizDetailsQuestion } from '../../shared/models/QuizDetailsQuestion';
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

  @Output() closed = new EventEmitter<void>();

  constructor(
    private renderer: Renderer2,
    private quizService: QuizService,
    private utilService: UtilService
  ) {

  }

  // Question Description
  ARROW_DIRECTION = {
    UP: '/assets/svg/icon_up_arrow.svg',
    DOWN: '/assets/svg/icon_down_arrow.svg'
  }

  descArrowSrc = this.ARROW_DIRECTION.DOWN

  ngOnChanges(changes: SimpleChanges): void {
    this.selectedQuizQuestions = this.selectedQuizQuestions.map(q => ({
      ...q,
      isExpanded: false
    }));
  }

  getDifficultyLabel(level: number) {
    return this.quizService.getDifficultyLabel(level);
  }

  getDifficultyColor(level: number) {
    return this.quizService.getDifficultyColor(level);
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

}

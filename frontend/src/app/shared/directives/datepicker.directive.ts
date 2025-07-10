import { AfterViewInit, Directive, ElementRef, EventEmitter, Output } from '@angular/core';

declare var $: any

@Directive({
  selector: '[appDatepicker]'
})
export class DatepickerDirective implements AfterViewInit {

  @Output() dateSelected: EventEmitter<string> = new EventEmitter<string>();

  constructor(private el: ElementRef) { }

  ngAfterViewInit(): void {
    const self = this;
    $(this.el.nativeElement).datepicker({
      dateFormat: 'dd.mm.yy',
      onSelect: (dateText: string) => {
        this.dateSelected.emit(dateText);
      }
    });
  }
}

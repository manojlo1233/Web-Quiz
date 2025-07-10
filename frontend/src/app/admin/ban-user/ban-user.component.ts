import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DateService } from '../../services/shared/date.service';

@Component({
  selector: 'app-ban-user',
  templateUrl: './ban-user.component.html',
  styleUrl: './ban-user.component.css'
})
export class BanUserComponent implements OnInit, AfterViewInit{
  @ViewChild('banDateRef') banDateRef!: ElementRef;

  constructor(
    private renderer: Renderer2,
    private dateService: DateService
  ) {}

  banDate: string = '';
  banHours = '00';
  banMinutes = '00';

  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {
    
  }

  checkDate() {
    this.dateService.checkDate(this.banDate, this.renderer, this.banDateRef);
  }

  getHours() {
    return this.dateService.hours;
  }

  getMinutes() {
    return this.dateService.minutes;
  }

  banDateSelected(dateText) {
    this.banDate = dateText;
    this.checkDate();
  }

}

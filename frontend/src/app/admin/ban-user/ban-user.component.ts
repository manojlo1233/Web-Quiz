import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { DateService } from '../../services/shared/date.service';
import { User } from '../../shared/models/User/User';
import { AdminService } from '../../services/admin/admin.service';
import { SnackBarService } from '../../services/shared/snack-bar.service';
import { ConfirmService } from '../../services/shared/confirm.service';

@Component({
  selector: 'app-ban-user',
  templateUrl: './ban-user.component.html',
  styleUrl: './ban-user.component.css'
})
export class BanUserComponent implements OnInit, AfterViewInit {
  @ViewChild('banDateRef') banDateRef!: ElementRef;
  @Output() close = new EventEmitter<{ userId: number, banned: boolean, date: Date }>();
  @Input() user: User;

  constructor(
    private renderer: Renderer2,
    private dateService: DateService,
    private adminService: AdminService,
    private snackBarService: SnackBarService,
    private confirmService: ConfirmService
  ) { }

  banDate: string = '';
  banHours = '00';
  banMinutes = '00';

  dateValid: boolean = false;


  ngOnInit(): void {

  }

  ngAfterViewInit(): void {

  }

  checkDate() {
    if (this.banDate === '') {
      this.dateValid = false;
      return;
    }
    this.dateValid = this.dateService.checkDate(this.banDate, this.banHours, this.banMinutes, this.renderer, this.banDateRef);
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

  handleClose() {
    this.close.emit({ userId: this.user.id, banned: false, date: null });
  }

  handleBanUser() {
    const date = (this.dateService.parseDate(`${this.banDate} ${this.banHours}:${this.banMinutes}:00`) as Date);
    console.log(date);
    const mysqlDate = this.dateService.convertDateToMysqlDateTime(date);
    console.log(mysqlDate)
    this.confirmService.showCustomConfirm(`Are you sure you want to ban ${this.user.username} until ${mysqlDate}?`, () => {
      this.adminService.banUser(this.user.id, mysqlDate).subscribe({
        next: (resp: any) => {
          this.snackBarService.showSnackBar(`${resp.message}`)
          this.close.emit({ userId: this.user.id, banned: true, date});
        },
        error: (error: any) => {
          this.snackBarService.showSnackBar(`${error.error.message}`)
        }
      })
    })
  }
}

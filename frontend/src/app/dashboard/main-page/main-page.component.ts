import { Component, OnInit } from '@angular/core';
import { User } from '../../shared/models/User';
import { UserService } from '../../services/shared/user.service';
import { Statistic } from '../../shared/models/Statistic';
import { UserPlayHistory } from '../../shared/models/UserPlayHistory';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit {

  constructor(
    private userService: UserService
  ) { }

  user: User = new User();
  userStatistic: Statistic = new Statistic();
  userPlayHistory: UserPlayHistory = new UserPlayHistory();

  // USER HISTORY TABLE
  userPlayHistoryColumns: string[] = ['Category', 'Difficulty', 'Start', 'Duration']

  ngOnInit(): void {
    const userId = parseInt(sessionStorage.getItem('userId'), 10);
    // --------- GET USER ---------
    this.userService.getUserById(userId).subscribe({
      next: (resp: any) => {
        this.user = resp;
      },
      error: (error: any) => {
        console.log(error)
      }
    })
    // --------- GET USER STATISTICS---------
    this.userService.getUserStatisticsById(userId).subscribe({
      next: (resp: any) => {
        this.userStatistic = resp;
      },
      error: (error: any) => {
        console.log(error)
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
        console.log(this.userPlayHistory)
      },
      error: (error: any) => {
        console.log(error);
      }
    })
  }
}

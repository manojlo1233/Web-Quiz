import { Component, OnInit } from '@angular/core';
import { User } from '../../shared/models/User';
import { UserService } from '../../services/shared/user.service';
import { Statistic } from '../../shared/models/Statistic';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit{

  constructor(
    private userService: UserService
  ) {}

  user: User = new User();
  userStatistic: Statistic = new Statistic();

  ngOnInit(): void {
    const userId = parseInt(sessionStorage.getItem('userId'), 10);
    this.userService.getUserById(userId).subscribe({
      next: (resp: any) => {
        this.user = resp;
      },
      error: (error: any) => {
        console.log(error)
      }
    })
    this.userService.getUserStatisticsById(userId).subscribe({
      next: (resp: any) => {
        this.userStatistic = resp;
      },
      error: (error: any) => {
        console.log(error)
      }
    })
  }
}

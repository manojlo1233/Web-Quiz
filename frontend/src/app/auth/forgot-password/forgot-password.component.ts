import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/shared/user.service';
import { User } from '../../shared/models/User/User';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit {

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    const userId = sessionStorage.getItem('userId');
    console.log(userId);
    if (userId) {
      this.userService.getUserById(Number.parseInt(userId)).subscribe({
        next: (resp: User) => {
          this.user = resp;
        },
        error: (error: any) => {
          // SHOW ERROR PAGE
        }
      })
    }
  }

  email: string = "";
  message: string = ""
  hasError: boolean = false;
  showButton = false;

  user: User = null;

  handleResetEmail() {
    this.hasError = false;
    if (this.user) {
      this.email = this.user.email
    }
    this.authService.requestPasswordReset(this.email).subscribe({
      next: (resp: any) => {
        this.message = 'Check your email for the reset link.';
        this.showButton = true;
      },
      error: (error: any) => {
        this.hasError = true;
        this.message = 'Error sending reset link.';
      }
    })
  }

  goToLogin() {
    console.log(this.user)
    if (this.user) {
      this.authService.logoutUser().subscribe(res => {
        sessionStorage.removeItem('accessToken');
        this.router.navigate([''])
      })
    }
    else {
      this.router.navigate([''])
    }

  }

}

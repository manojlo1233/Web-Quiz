import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { SnackBarService } from '../../services/shared/snack-bar.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/shared/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(
    private authService: AuthService,
    private snackBarService: SnackBarService,
    private userService: UserService,
    private router: Router
  ) { }

  usernameOrEmail: string = '';
  password: string = '';

  onSubmit() {
    this.authService.loginUser(this.usernameOrEmail, this.password).subscribe({
      next: (resp: any) => {
        console.log(resp);
        sessionStorage.setItem('userId', resp.user.id);
        sessionStorage.setItem('userUsername', resp.user.username);
        this.router.navigate(['dashboard/main-page']);
      },
      error: (error: any) => {
        this.snackBarService.showSnackBar(error.error.message)
      }
    })
  }
}

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { SnackBarService } from '../../services/shared/snack-bar.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(
    private authService: AuthService,
    private snackBarService: SnackBarService
  )
  {}

  usernameOrEmail: string = '';
  password: string = '';

  onSubmit() {
    this.authService.loginUser(this.usernameOrEmail, this.password).subscribe((resp: any) => {
      if (resp.message) {
        this.snackBarService.showSnackBar(resp.message)
      }
      console.log(resp.user)
    })
  }
}

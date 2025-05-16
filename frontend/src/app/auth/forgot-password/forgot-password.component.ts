import { Component } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {

  constructor(
    private authService: AuthService
  ) { }

  email: string = "";
  message: string = ""
  hasError: boolean = false;
  showButton = false;

  handleResetEmail() {
    this.hasError = false;
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

}

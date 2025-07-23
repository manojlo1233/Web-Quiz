import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {

  token: string = '';
  newPassword = '';
  confPassword = '';
  success = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token');
  }

  onSubmit() {
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (resp: any) => {
        this.success = true;
      },
      error: (error) => {

      }
    })
  }

  goToLogin() {
    this.authService.logoutUser().subscribe(res => {
      sessionStorage.removeItem('sessionToken');
      this.router.navigate([''])
    })
  }
}

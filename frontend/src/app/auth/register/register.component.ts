import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { SnackBarService } from '../../services/shared/snack-bar.service';
import { NgForm } from '@angular/forms';
import { CountriesService } from '../../services/shared/countries.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {

  @ViewChild('registerForm') registerForm!: NgForm;

  constructor(
    private router: Router,
    private authService: AuthService,
    private snackBarService: SnackBarService,
    private countriesService: CountriesService
  ) { }

  ngOnInit(): void {
    this.countries = this.countriesService.countries;
  }

  countries: string[] = [];

  firstName: string = '';
  secondName: string = '';
  email: string = '';
  username: string = '';
  password: string = '';
  confPassword: string = '';
  country: string = '--None--';
  birth: string = '';
  notification: boolean = false;
  terms: boolean = false;

  benefits: string[] = [
    "Interactive learning experiences that help you explore new topics.",
    "Knowledge-based challenges and competitions to test your skills.",
    "Fun mini-games and animations that make learning engaging and enjoyable.",
    "A community of curious minds, just like you."
  ]

  onSubmit() {
    this.authService.registerUser(this.firstName, this.secondName, this.email, this.username, this.password, this.country, this.notification).subscribe((resp: any) => {
      if (resp.message) {
        this.snackBarService.showSnackBar(resp.message);
        this.reset();
      }
    })
  }

  reset() {
    this.registerForm.reset();
    this.terms = false;
    this.notification = false;
    this.country = '--None--'
  }

  onLogin() {
    this.router.navigate([''])
  }
}

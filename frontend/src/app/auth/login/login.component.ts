import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  usernameOrEmail: string = '';
  password: string = '';

  onSubmit() {
    console.log('Logging in with', this.usernameOrEmail, this.password);
  }
}

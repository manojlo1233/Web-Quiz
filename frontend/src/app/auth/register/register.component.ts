import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  firstName: string = '';
  secondName: string = '';
  email: string = '';
  username: string = '';
  password: string = '';
  country: string = '';
  birth: string = '';

  benefits: string[] = [
    "Interactive learning experiences that help you explore new topics.",
    "Knowledge-based challenges and competitions to test your skills.",
    "Fun mini-games and animations that make learning engaging and enjoyable.",
    "A community of curious minds, just like you."
  ]

  onSubmit() {
    console.log('Logging in with', this.email, this.password);
  }
}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { TermsComponent } from './auth/terms/terms.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';

const routes: Routes = [
  { path: "", component: LoginComponent },
  { path: "auth/register", component: RegisterComponent },
  { path: "auth/terms", component: TermsComponent },
  { path: "auth/forgot-password", component: ForgotPasswordComponent},
  { path: "auth/reset-password/:token", component: ResetPasswordComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

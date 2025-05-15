import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { TermsComponent } from './auth/terms/terms.component';

const routes: Routes = [
  { path: "", component: LoginComponent },
  { path: "auth/register", component: RegisterComponent },
  { path: "auth/terms", component: TermsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

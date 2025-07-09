import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { TermsComponent } from './auth/terms/terms.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { MainPageComponent } from './dashboard/main-page/main-page.component';
import { BattleComponent } from './quiz/battle/battle.component';
import { ReadyScreenComponent } from './quiz/ready-screen/ready-screen.component';
import { AdminSettingsComponent } from './admin/admin-settings/admin-settings.component';

const routes: Routes = [
  { path: "", component: LoginComponent },
  // ----------------- AUTH -----------------
  { path: "auth/register", component: RegisterComponent },
  { path: "auth/terms", component: TermsComponent },
  { path: "auth/forgot-password", component: ForgotPasswordComponent },
  { path: "auth/reset-password/:token", component: ResetPasswordComponent },
  // ----------------- DASHBOARD -----------------
  { path: "dashboard/main-page", component: MainPageComponent },
  // ----------------- QUIZ -----------------
  { path: "quiz/loading-screen", component: ReadyScreenComponent },
  { path: "quiz/battle", component: BattleComponent },
  // ----------------- ADMIN -----------------
  { path: "admin/admin-settings", component: AdminSettingsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

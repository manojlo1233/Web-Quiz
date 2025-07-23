import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './shared/ui-indicators/icon/icon.component';
import { TermsComponent } from './auth/terms/terms.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { MainPageComponent } from './dashboard/main-page/main-page.component';
import { QuizDetailsComponent } from './dashboard/quiz-details/quiz-details.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BattleComponent } from './quiz/battle/battle.component';
import { ReadyScreenComponent } from './quiz/ready-screen/ready-screen.component';
import { FriendNotificationComponent } from './shared/ui-indicators/friend-notification/friend-notification.component';
import { NotificationContainerComponent } from './shared/ui-indicators/notification-container/notification-container.component';
import { UserSettingsComponent } from './dashboard/user-settings/user-settings.component';
import { SpinnerComponent } from './shared/ui-indicators/spinner/spinner.component';
import { BattleSummaryComponent } from './quiz/battle-summary/battle-summary.component';
import { ShowAvatarsComponent } from './dashboard/show-avatars/show-avatars.component';
import { DotLoaderComponent } from './shared/ui-indicators/dot-loader/dot-loader.component';
import { AdminSettingsComponent } from './admin/admin-settings/admin-settings.component';
import { DatepickerDirective } from './shared/directives/datepicker.directive';
import { BanUserComponent } from './admin/ban-user/ban-user.component';
import { UserDetailsComponent } from './admin/user-details/user-details.component';
import { ShowMessageComponent } from './shared/components/show-message/show-message.component';
import { ReportComponent } from './shared/components/report/report.component';
import { UserReportsComponent } from './admin/user-reports/user-reports.component';
import { NewsCarouselComponent } from './dashboard/news-carousel/news-carousel.component';
import { AuthInterceptorService } from './services/auth/auth-interceptor.service';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    HeaderComponent,
    FooterComponent,
    IconComponent,
    TermsComponent,
    ResetPasswordComponent,
    MainPageComponent,
    QuizDetailsComponent,
    BattleComponent,
    ReadyScreenComponent,
    FriendNotificationComponent,
    NotificationContainerComponent,
    UserSettingsComponent,
    SpinnerComponent,
    BattleSummaryComponent,
    ShowAvatarsComponent,
    DotLoaderComponent,
    AdminSettingsComponent,
    DatepickerDirective,
    BanUserComponent,
    UserDetailsComponent,
    ShowMessageComponent,
    ReportComponent,
    UserReportsComponent,
    NewsCarouselComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

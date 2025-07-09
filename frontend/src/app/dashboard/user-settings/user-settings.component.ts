import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { User } from '../../shared/models/User';
import { UserSettingsService } from '../../services/dashboard/user-settings.service';
import { CountriesService } from '../../services/shared/countries.service';
import { SnackBarService } from '../../services/shared/snack-bar.service';
import { SpinnerComponent } from '../../shared/ui-indicators/spinner/spinner.component';
import { ConfirmService } from '../../services/shared/confirm.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.css'
})
export class UserSettingsComponent implements OnInit {
  @ViewChild('userSettingsForm') userSettingsForm!: NgForm;
  @Input() user: User;
  @Output() close = new EventEmitter<void>();
  @ViewChild('spinnerContainer', { read: ViewContainerRef }) spinnerContainer!: ViewContainerRef;

  constructor(
    private userSettingsService: UserSettingsService,
    private countriesService: CountriesService,
    private snackBarService: SnackBarService,
    private confirmService: ConfirmService
  ) { }

  editing: boolean = false;

  countries: string[] = [];
  firstnameEdit: string;
  lastnameEdit: string;
  usernameEdit: string;
  emailEdit: string;
  countryEdit: string;
  updateEdit: boolean;
  showSpinner: boolean = false;

  ngOnInit(): void {
    this.countries = this.countriesService.countries;
  }

  closeModal() {
    this.close.emit();
  }

  editUser() {
    this.editing = true;
    this.firstnameEdit = this.user.firstname;
    this.lastnameEdit = this.user.lastname;
    this.usernameEdit = this.user.username;
    this.emailEdit = this.user.email;
    this.countryEdit = this.user.country;
    this.updateEdit = this.user.receive_updates == 1;
  }

  cancelEditing() {
    this.confirmService.showCustomConfirm(
      `Are you sure you want to cancel editing?`,
      () => {
        this.editing = false;
      },
      () => {}
    )
  }

  saveEditing() {
    this.showSpinner = true;
    this.userSettingsService.updateUserSettingsById(this.user.id, this.firstnameEdit, this.lastnameEdit, this.usernameEdit, this.emailEdit, this.countryEdit, this.updateEdit).subscribe({
      next: (resp: any) => {
        this.updateUser();
        this.snackBarService.showSnackBar(resp.message);
        this.showSpinner = false;
        this.editing = false;
      },
      error: (error: any) => {
        this.updateUser();
        this.snackBarService.showSnackBar('Update failed.')
        this.showSpinner = false;
        this.editing = false;
      }
    })
  }

  updateUser() {
    this.user.firstname = this.firstnameEdit;
    this.user.lastname = this.lastnameEdit;
    this.user.username = this.usernameEdit;
    this.user.email = this.emailEdit;
    this.user.country = this.countryEdit;
    this.user.receive_updates = this.updateEdit ? 1 : 0;
  }

  handleResetPassword() {
    const url = '/auth/forgot-password';
    window.open(url, '_blank');
  }
}

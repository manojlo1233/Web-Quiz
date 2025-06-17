import { Component, Input, OnInit } from '@angular/core';
import { User } from '../../shared/models/User';
import { UserSettingsService } from '../../services/dashboard/user-settings.service';
import { CountriesService } from '../../services/shared/countries.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.css'
})
export class UserSettingsComponent implements OnInit {
  @Input() user: User;

  constructor(
    private userSettingsService: UserSettingsService,
    private countriesService: CountriesService
  ) { }

  editing: boolean = false;

  countries: string[] = [];
  firstnameEdit: string;
  lastnameEdit: string;
  usernameEdit: string;
  emailEdit: string;
  countryEdit: string;
  updateEdit: boolean;

  ngOnInit(): void {
    this.countries = this.countriesService.countries;
  }

  closeModal() {
    this.userSettingsService.clearContainer();
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
    this.editing = false;
  }

  saveEditing() {
    this.editing = false;
  }
}

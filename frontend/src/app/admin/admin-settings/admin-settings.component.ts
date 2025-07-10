import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/shared/user.service';
import { User } from '../../shared/models/User';
import { AdminService } from '../../services/admin/admin.service';
import { Category } from '../../shared/models/Category';
import { UtilService } from '../../services/shared/util.service';
import { QuizAnswer } from '../../shared/models/Quiz/QuizAnswer';
import { NotificationService } from '../../services/shared/notification.service';
import { ConfirmService } from '../../services/shared/confirm.service';
import { SnackBarService } from '../../services/shared/snack-bar.service';

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css'
})
export class AdminSettingsComponent implements OnInit {

  constructor(
    private userService: UserService,
    private adminService: AdminService,
    private utilService: UtilService,
    private snackBarService: SnackBarService,
    private confirmService: ConfirmService
  ) { }

  user: User = new User();
  allUsers: User[] = [];

  questionText: string = '';
  questionDescription: string = '';
  answer1: string = '';
  answer2: string = '';
  answer3: string = '';
  answer4: string = '';
  correctAnswer: number = 1;

  allCategories: Category[] = [];
  selectedCategory: string = '';

  ngOnInit(): void {
    const userId = sessionStorage.getItem('userId');
    // -------------------- GET USER --------------------
    this.userService.getUserById(Number.parseInt(userId)).subscribe({
      next: (resp: User) => {
        this.user = resp;
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })
    // -------------------- GET ALL USERS --------------------
    this.adminService.getAllUsers().subscribe({
      next: (resp: User[]) => {
        this.allUsers = resp;
        console.log(this.allUsers)
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })
    // -------------------- GET ALL CATEGORIES --------------------
    this.utilService.getAllCategories().subscribe({
      next: (resp: Category[]) => {
        this.allCategories = resp;
        this.allCategories = this.allCategories.filter(c => c.name !== 'General')
        if (this.allCategories.length > 0) {
          this.selectedCategory = this.allCategories[0].name;
        }
        else {
          this.selectedCategory = 'ERROR'
        }
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })
  }

  handleAddQuestion() {
    this.confirmService.showCustomConfirm(`Are you sure you want to proceed?`,
      () => {
        const categoryId = this.allCategories.filter(c => c.name === this.selectedCategory)[0].id;
        const answers: QuizAnswer[] = [
          new QuizAnswer(0, this.answer1, this.correctAnswer === 1),
          new QuizAnswer(0, this.answer2, this.correctAnswer === 2),
          new QuizAnswer(0, this.answer3, this.correctAnswer === 3),
          new QuizAnswer(0, this.answer4, this.correctAnswer === 4)
        ];
        this.adminService.addQuestion(this.questionText, this.questionDescription, categoryId, answers).subscribe({
          next: (resp: any) => {
            this.snackBarService.showSnackBar(resp.message);
          },
          error: (error: any) => {
            this.snackBarService.showSnackBar(error.error.message);
          }
        })
      }
    )
  }

  showDetails(user: User) {

  }

  banUser(user: User) {

  }

  unbanUser(user: User) {

  }

  deleteUser(item: User) {
    this.confirmService.showCustomConfirm(`Are you sure you want to delete ${item.username}'s user account?`, () => {
      this.adminService.deleteUser(item.id).subscribe({
        next: (resp: any) => {
          this.snackBarService.showSnackBar(resp.message);
          if (resp.message === 'User deleted successfully.') this.allUsers = this.allUsers.filter(u => u.id !== item.id)
        },
        error: (error: any) => {
          // SHOW ERROR PAGE
        }
      })
    })

  }

  isButtonBanDisabled(item: User): boolean {
    if (this.user.id === item.id || item.role === 1 || item.banned_until) {
      return true;
    }
    else {
      return false;
    }
  }

  isButtonDeleteDisabled(item: User): boolean {
    if (this.user.id === item.id || item.role === 1) {
      return true;
    }
    else {
      return false;
    }
  }

}

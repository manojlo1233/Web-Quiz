import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../../services/shared/user.service';
import { User } from '../../shared/models/User';
import { AdminService } from '../../services/admin/admin.service';
import { Category } from '../../shared/models/Category';
import { UtilService } from '../../services/shared/util.service';
import { QuizAnswer } from '../../shared/models/Quiz/QuizAnswer';
import { NotificationService } from '../../services/shared/notification.service';
import { ConfirmService } from '../../services/shared/confirm.service';
import { SnackBarService } from '../../services/shared/snack-bar.service';
import { DateService } from '../../services/shared/date.service';
import { Subscription } from 'rxjs';
import { WebsocketService } from '../../services/quiz/websocket.service';

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css'
})
export class AdminSettingsComponent implements OnInit, OnDestroy {

  constructor(
    private userService: UserService,
    private adminService: AdminService,
    private utilService: UtilService,
    private snackBarService: SnackBarService,
    private confirmService: ConfirmService,
    private dateService: DateService,
    private wsService: WebsocketService
  ) { }

  // SUBSCRIPTIONS
  private connectionSub: Subscription;
  private adminUserBannedSub: Subscription;
  private adminUserUnbannedSub: Subscription;
  private adminUserDeletedSub: Subscription;

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

  // BAN
  openBanUser: boolean = false;
  banUser: User = null;

  // USER DETAILS
  userDetails: User = null;
  openUserDetails: boolean = false;

  // USER REPORTS
  userReports: User = null;
  openUserReports: boolean = false;

  // TABLE
  pageSize = 10;
  currentPage = 1;

  ngOnInit(): void {
    const userId = Number.parseInt(sessionStorage.getItem('userId'));
    // -------------------- GET USER --------------------
    this.userService.getUserById(userId).subscribe({
      next: (resp: User) => {
        this.user = resp;
        this.wsService.connect();
        if (this.connectionSub) this.connectionSub.unsubscribe();
        this.connectionSub = this.wsService.connectionOpen$.subscribe(() => {
          this.wsService.sendHelloAsAdmin(userId, this.user.username);
        })
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })
    // -------------------- GET ALL USERS --------------------
    this.adminService.getAllUsers().subscribe({
      next: (resp: User[]) => {
        this.allUsers = resp;
        this.allUsers = this.allUsers.map((u) => {
          if (u.banned_until) {
            return { ...u, banned_until: new Date(u.banned_until) }
          }
          return u;
        })
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

    // -------------------- SUBSCRIPTIONS --------------------
    this.adminUserBannedSub = this.wsService.adminUserBanned$.subscribe((resp: any) => {
      const user = this.allUsers.find(u => u.id === resp.userId);
      user.banned_until = new Date(resp.banned_until);
    })

    this.adminUserUnbannedSub = this.wsService.adminUserUnbanned$.subscribe((data: any) => {
      const user = this.allUsers.find(u => u.id === data.userId);
      user.banned_until = null;
    })

    this.adminUserDeletedSub = this.wsService.adminUserDeleted$.subscribe((data: any) => {
      this.allUsers = this.allUsers.filter(u => u.id !== data.userId);
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

  handleShowDetails(user: User) {
    this.userDetails = user;
    this.openUserDetails = true;
  }

  handleCloseUserDetails() {
    this.userDetails = null;
    this.openUserDetails = false;
  }

  handleShowReports(user: User) {
    this.userReports = user;
    this.openUserReports = true;
  }

  handleCloseUserReports() {
    this.userReports = null;
    this.openUserReports = false;
  }

  handleBanUser(user: User) {
    this.banUser = user;
    this.openBanUser = true;
  }

  handleUnbanUser(user: User) {
    const date = this.dateService.convertDateToMysqlDateTime(user.banned_until);;
    this.confirmService.showCustomConfirm(`Are you sure you want to unban ${user.username}? Banned until: ${date}`, () => {
      this.adminService.unbanUser(user.id).subscribe({
        next: (resp: any) => {
          this.snackBarService.showSnackBar(resp.message);
          this.allUsers.forEach(u => {
            if (u.id === user.id) {
              u.banned_until = null;
            }
          })
        },
        error: (error: any) => {
          if (error.status === 409) {
            this.snackBarService.showSnackBar(error.error.message);
          }
        }
      })
    })
  }

  deleteUser(item: User) {
    this.confirmService.showCustomConfirm(`Are you sure you want to delete ${item.username}'s user account?`, () => {
      this.adminService.deleteUser(item.id).subscribe({
        next: (resp: any) => {
          this.snackBarService.showSnackBar(resp.message);
          if (resp.message === 'User deleted successfully.') this.allUsers = this.allUsers.filter(u => u.id !== item.id)
        },
        error: (error: any) => {
          if (error.status === 409) {
            this.snackBarService.showSnackBar(error.error.message);
          }

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

  handleCloseBan(banResult: { userId: number, banned: boolean, date: Date }) {
    this.openBanUser = false;
    if (banResult.banned) {
      const user = this.allUsers.find(u => u.id === banResult.userId);
      user.banned_until = banResult.date;
    }
  }

  // ---------------- TABLE ----------------
  get filteredData(): any[] {
    return this.allUsers.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(
      this.allUsers.length / this.pageSize
    );
  }

  changePage(delta: number) {
    const newPage = this.currentPage + delta;
    if (newPage > 0 && newPage <= this.totalPages) {
      this.currentPage = newPage;
    }
  }

  firstPage() {
    this.currentPage = 1;
  }

  lastPage() {
    this.currentPage = this.totalPages;
  }

  ngOnDestroy(): void {
    if (this.adminUserBannedSub) this.adminUserBannedSub.unsubscribe();
    if (this.adminUserUnbannedSub) this.adminUserUnbannedSub.unsubscribe();
    if (this.adminUserDeletedSub) this.adminUserDeletedSub.unsubscribe();
  }

}

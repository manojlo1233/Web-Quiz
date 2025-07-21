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
import { QuizQuestion } from '../../shared/models/Quiz/QuizQuestion';
import { Paginator } from '../../shared/models/Util/Paginator';
import { DifficultyMapper } from '../../shared/mappers/difficultyMapper';

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

  // TAB
  selectedTab: string = 'Edit'
  // USER
  user: User = new User();
  allUsers: User[] = [];

  // QUESTIONS
  allQuestions: QuizQuestion[] = [];

  editQuestion: boolean = false;
  // EDIT
  editQuestionId: number;
  editQuestionText: string = '';
  editQuestionDescription: string = '';
  editAnswer1: string = '';
  editAnswer2: string = '';
  editAnswer3: string = '';
  editAnswer4: string = '';
  editCorrectAnswer: number = 1;
  selectedCategoryEdit: string = '';
  selectedDifficultyEdit: number = 1;
  // NEW
  newQuestionText: string = '';
  newQuestionDescription: string = '';
  newAnswer1: string = '';
  newAnswer2: string = '';
  newAnswer3: string = '';
  newAnswer4: string = '';
  newCorrectAnswer: number = 1;
  selectedCategoryNew: string = '';
  selectedDifficultyNew: number = 1;

  allCategories: Category[] = [];
  allDifficulties: number[] = [1, 2, 3];

  // BAN
  openBanUser: boolean = false;
  banUser: User = null;

  // USER DETAILS
  userDetails: User = null;
  openUserDetails: boolean = false;

  // USER REPORTS
  userReports: User = null;
  openUserReports: boolean = false;

  // PAGINATORS
  usersPaginator: Paginator = new Paginator(this.allUsers, 10);
  questionsPaginator: Paginator = new Paginator(this.allQuestions, 10);
  categoriesPaginator: Paginator = new Paginator(this.allCategories, 10);

  // CATEGORY
  newCategoryText: string = ''

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
        this.usersPaginator = new Paginator(this.allUsers, 30);
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })
    // -------------------- GET ALL QUESTIONS --------------------
    this.adminService.getAllQuestions().subscribe({
      next: (resp: QuizQuestion[]) => {
        this.allQuestions = resp;
        this.questionsPaginator = new Paginator(this.allQuestions, 30);
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
          this.selectedCategoryNew = this.allCategories[0].name;
          this.categoriesPaginator.array = this.allCategories;
        }
        else {
          this.selectedCategoryNew = 'ERROR'
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
        const categoryId = this.allCategories.filter(c => c.name === this.selectedCategoryNew)[0].id;
        const answers: QuizAnswer[] = [
          new QuizAnswer(0, this.newAnswer1, this.newCorrectAnswer === 1),
          new QuizAnswer(0, this.newAnswer2, this.newCorrectAnswer === 2),
          new QuizAnswer(0, this.newAnswer3, this.newCorrectAnswer === 3),
          new QuizAnswer(0, this.newAnswer4, this.newCorrectAnswer === 4)
        ];
        this.adminService.addQuestion(this.newQuestionText, this.newQuestionDescription, categoryId, this.selectedDifficultyNew, answers).subscribe({
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

  getQuestionDifficulty(diff: number): string {
    return DifficultyMapper.getDifficulty(diff);
  }

  handleEditQuestion(item: QuizQuestion) {
    if (this.allCategories.length === 0) {
      this.snackBarService.showSnackBar(`There are no categories available`);
      return;
    }
    this.setEditCategory(item);
    this.selectedDifficultyEdit = item.difficulty;
    this.editQuestionId = item.id;
    this.editQuestionText = item.text;
    this.editQuestionDescription = item.description
    this.editAnswer1 = item.answers[0].text;
    this.editAnswer2 = item.answers[1].text;
    this.editAnswer3 = item.answers[2].text;
    this.editAnswer4 = item.answers[3].text;
    this.editCorrectAnswer = item.answers[0].isCorrect ? 1 : this.editCorrectAnswer;
    this.editCorrectAnswer = item.answers[1].isCorrect ? 2 : this.editCorrectAnswer;
    this.editCorrectAnswer = item.answers[2].isCorrect ? 3 : this.editCorrectAnswer;
    this.editCorrectAnswer = item.answers[3].isCorrect ? 4 : this.editCorrectAnswer;
    this.editQuestion = true;
  }

  setEditCategory(item: QuizQuestion) {
    const cat = this.allCategories.filter(c => c.id === item.category_id);
    if (cat.length === 0) {
      this.selectedCategoryEdit = this.allCategories[0].name;
    }
    else {
      this.selectedCategoryEdit = this.allCategories.filter(c => c.id === item.category_id)[0].name;
    }
  }

  handleSaveEdit() {
    this.confirmService.showCustomConfirm(`Are you sure you want to save edit?`, () => {
      const categoryId = this.allCategories.filter(c => c.name === this.selectedCategoryEdit)[0].id;
      const answers: QuizAnswer[] = [
        new QuizAnswer(0, this.editAnswer1, this.editCorrectAnswer === 1),
        new QuizAnswer(0, this.editAnswer2, this.editCorrectAnswer === 2),
        new QuizAnswer(0, this.editAnswer3, this.editCorrectAnswer === 3),
        new QuizAnswer(0, this.editAnswer4, this.editCorrectAnswer === 4)
      ];
      this.adminService.updateQuestion(this.editQuestionId, this.editQuestionText, this.editQuestionDescription, categoryId, this.selectedDifficultyEdit, answers).subscribe({
        next: (resp: any) => {
          this.snackBarService.showSnackBar(resp.message);
          this.updateQuestionLocal();
          this.editQuestion = false;
        },
        error: (error: any) => {
          this.snackBarService.showSnackBar(error.message);
          console.log(error.error);
        }
      })

    })
  }

  updateQuestionLocal() {
    const question = this.allQuestions.filter(q => q.id = this.editQuestionId)[0];
    const categoryId = this.allCategories.filter(c => c.name === this.selectedCategoryEdit)[0].id;
    const answers: QuizAnswer[] = [
      new QuizAnswer(0, this.editAnswer1, this.editCorrectAnswer === 1),
      new QuizAnswer(0, this.editAnswer2, this.editCorrectAnswer === 2),
      new QuizAnswer(0, this.editAnswer3, this.editCorrectAnswer === 3),
      new QuizAnswer(0, this.editAnswer4, this.editCorrectAnswer === 4)
    ];
    question.category_id = categoryId;
    question.answers = answers;
    question.text = this.editQuestionText;
    question.description = this.editQuestionDescription;
    question.difficulty = Number.parseInt(this.selectedDifficultyEdit.toString()); // Iz nekog razloga je difficulty upisivao kao string pa je ovo pokusaj kastovanja u number, iako je vec bio unmber...
    console.log(question)
  }

  handleCancelEdit() {
    this.confirmService.showCustomConfirm(`Are you sure you want to cancel edit?`, () => {
      this.editQuestion = false;
    })

  }

  handleDeleteQuestion(item: QuizQuestion) {
    this.confirmService.showCustomConfirm(`Are you sure you want to delete question?`, () => {
      this.adminService.deleteQuestion(item.id).subscribe({
        next: (resp: any) => {
          this.snackBarService.showSnackBar(resp.message);
          this.allQuestions = this.allQuestions.filter(q => q.id !== item.id);
          this.questionsPaginator.array = this.allQuestions;
        },
        error: (error: any) => {
          // SHOW ERROR PAGE
        }
      })
    });
  }

  getDifficultyColor(item: QuizQuestion) {
    switch (item.difficulty) {
      case 1:
        return 'color: var(--theme-darkblue-green)'
      case 2:
        return 'color: var(--theme-darkblue-orange)'
      default:
        return 'color: var(--theme-darkblue-red)'
    }
  }

  getCategoryName(item: QuizQuestion) {
    const cat = this.allCategories.filter(c => c.id === item.category_id);
    if (cat.length === 0) {
      return 'UNDEFINED';
    }
    else return cat[0].name;
  }

  deleteCategory(item: Category) {
    this.confirmService.showCustomConfirm(`Are you sure you want to delete "${item.name}" category?`, () => {
      this.adminService.deleteCategory(item.id).subscribe({
        next: (resp: any) => {
          this.snackBarService.showSnackBar(resp.message);
          this.allCategories = this.allCategories.filter(c => c.name !== item.name);
        },
        error: (error: any) => {
          // SHOW ERROR PAGE
        }
      })
    })
  }

  addCategory() {
    this.confirmService.showCustomConfirm(`Are you sure you want to add "${this.newCategoryText}" category?`, () => {
      this.adminService.addCategory(this.newCategoryText).subscribe({
        next: (resp: any) => {
          const { categoryId, message } = resp;
          this.snackBarService.showSnackBar(message);
          this.allCategories.push(new Category(categoryId, this.newCategoryText));
        },
        error: (error: any) => {
          // SHOW ERROR PAGE
        }
      })
    })
  }

  clearCategoryText() {
    this.newCategoryText = '';
  }

  ngOnDestroy(): void {
    if (this.adminUserBannedSub) this.adminUserBannedSub.unsubscribe();
    if (this.adminUserUnbannedSub) this.adminUserUnbannedSub.unsubscribe();
    if (this.adminUserDeletedSub) this.adminUserDeletedSub.unsubscribe();
  }

}

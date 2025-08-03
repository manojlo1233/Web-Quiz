import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserService } from '../../services/shared/user.service';
import { User } from '../../shared/models/User/User';
import { AdminService } from '../../services/admin/admin.service';
import { Category } from '../../shared/models/Shared/Category';
import { UtilService } from '../../services/shared/util.service';
import { QuizAnswer } from '../../shared/models/Quiz/QuizAnswer';
import { ConfirmService } from '../../services/shared/confirm.service';
import { SnackBarService } from '../../services/shared/snack-bar.service';
import { DateService } from '../../services/shared/date.service';
import { filter, Subscription } from 'rxjs';
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
  private adminBanExpired: Subscription;

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

  set usersSearch(value: string) {
    this.usersPaginator.searchText = value;
  }
  set questionsSearch(value: string) {
    this.questionsPaginator.searchText = value;
  }

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
        this.updateUserPaginator();
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })
    // -------------------- GET ALL QUESTIONS --------------------
    this.adminService.getAllQuestions().subscribe({
      next: (resp: QuizQuestion[]) => {
        this.allQuestions = resp;
        this.updateQuestionPaginator();
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
        this.updateQuestionPaginator();
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })

    // -------------------- SUBSCRIPTIONS --------------------
    this.adminUserBannedSub = this.wsService.adminUserBanned$.subscribe((resp: any) => {
      const user = this.allUsers.find(u => u.id === resp.userId);
      user.banned_until = new Date(resp.banned_until);
      this.updateUserPaginator();
    })

    this.adminUserUnbannedSub = this.wsService.adminUserUnbanned$.subscribe((data: any) => {
      const user = this.allUsers.find(u => u.id === data.userId);
      user.banned_until = null;
      this.updateUserPaginator();
    })

    this.adminUserDeletedSub = this.wsService.adminUserDeleted$.subscribe((data: any) => {
      this.allUsers = this.allUsers.filter(u => u.id !== data.userId);
      this.updateUserPaginator();
    })

    this.adminBanExpired = this.wsService.adminBanExpired$.subscribe((data: any) => {
      const user = this.allUsers.find(u => u.id === data.userId);
      user.banned_until = null;
      this.updateUserPaginator();
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
        const question = new QuizQuestion();
        question.category_id = categoryId;
        question.text = this.newQuestionText;
        question.description = this.newQuestionDescription;
        question.difficulty = Number.parseInt(this.selectedDifficultyNew.toString());
        question.answers = answers;
        this.adminService.addQuestion(this.newQuestionText, this.newQuestionDescription, categoryId, this.selectedDifficultyNew, answers).subscribe({
          next: (resp: any) => {
            question.id = resp.questionId;
            this.allQuestions.push(question);
            this.sortQuestionsByDifficulty();
            this.updateQuestionPaginator();
            this.snackBarService.showSnackBar(resp.message);
          },
          error: (error: any) => {
            this.snackBarService.showSnackBar(error.error.message);
          }
        })
      }
    )
  }

  updateUserPaginator() {
    this.usersPaginator.array = this.allUsers.map(u => {
      let last_login = undefined;
      if (u.last_login) {
        last_login = this.dateService.convertDateToEuropeDate(new Date(u.last_login))
      }
      return {
        username: u.username,
        last_login
      }
    });
  }

  handleShowDetails(filteredUser: any) {
    this.userDetails = this.allUsers.find(u => u.username === filteredUser.username);
    this.openUserDetails = true;
  }

  handleCloseUserDetails() {
    this.userDetails = null;
    this.openUserDetails = false;
  }

  handleShowReports(filteredUser: any) {
    this.userReports = this.allUsers.find(u => u.username === filteredUser.username);
    this.openUserReports = true;
  }

  handleCloseUserReports() {
    this.userReports = null;
    this.openUserReports = false;
  }

  handleBanUser(filteredUser: any) {
    this.banUser = this.allUsers.find(u => u.username === filteredUser.username);
    this.openBanUser = true;
  }

  handleUnbanUser(filteredUser: any) {
    const user = this.allUsers.find(u => u.username === filteredUser.username);
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
          this.updateUserPaginator();
        },
        error: (error: any) => {
          if (error.status === 409) {
            this.snackBarService.showSnackBar(error.error.message);
          }
        }
      })
    })
  }

  deleteUser(filteredUser: User) {
    const user = this.allUsers.find(u => u.username === filteredUser.username);
    this.confirmService.showCustomConfirm(`Are you sure you want to delete ${user.username}'s user account?`, () => {
      this.adminService.deleteUser(user.id).subscribe({
        next: (resp: any) => {
          this.snackBarService.showSnackBar(resp.message);
          if (resp.message === 'User deleted successfully.') {
            this.allUsers = this.allUsers.filter(u => u.id !== user.id)
            this.updateUserPaginator();
          }
        },
        error: (error: any) => {
          if (error.status === 409) {
            this.snackBarService.showSnackBar(error.error.message);
          }
        }
      })
    })
  }

  isUserBanned(filteredUser: any) {
    const user = this.allUsers.find(u => u.username === filteredUser.username);
    return user.banned_until;
  }

  isButtonBanDisabled(filteredUser: any): boolean {
    const user = this.allUsers.find(u => u.username === filteredUser.username);
    if (this.user.id === user.id || user.role === 1 || user.banned_until) {
      return true;
    }
    else {
      return false;
    }
  }

  isButtonDeleteDisabled(filteredUser: any): boolean {
    const user = this.allUsers.find(u => u.username === filteredUser.username);
    if (this.user.id === user.id || user.role === 1) {
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

  handleTabSelect(tab: string) {
    this.selectedTab = tab;
    if (this.selectedTab === 'Edit') {
      this.questionsPaginator.searchText = '';
    }
  }

  getQuestionDifficulty(diff: number): string {
    return DifficultyMapper.getDifficulty(diff);
  }

  handleEditQuestion(filteredQuestions: any) {
    const question = this.allQuestions.find(q => q.text === filteredQuestions.text);
    if (this.allCategories.length === 0) {
      this.snackBarService.showSnackBar(`There are no categories available`);
      return;
    }
    this.setEditCategory(question);
    this.selectedDifficultyEdit = question.difficulty;
    this.editQuestionId = question.id;
    this.editQuestionText = question.text;
    this.editQuestionDescription = question.description
    this.editAnswer1 = question.answers[0].text;
    this.editAnswer2 = question.answers[1].text;
    this.editAnswer3 = question.answers[2].text;
    this.editAnswer4 = question.answers[3].text;
    this.editCorrectAnswer = question.answers[0].isCorrect ? 1 : this.editCorrectAnswer;
    this.editCorrectAnswer = question.answers[1].isCorrect ? 2 : this.editCorrectAnswer;
    this.editCorrectAnswer = question.answers[2].isCorrect ? 3 : this.editCorrectAnswer;
    this.editCorrectAnswer = question.answers[3].isCorrect ? 4 : this.editCorrectAnswer;
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
          this.questionsPaginator.searchText = '';
          this.sortQuestionsByDifficulty();
          this.updateQuestionPaginator();
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
  }

  handleCancelEdit() {
    this.confirmService.showCustomConfirm(`Are you sure you want to cancel edit?`, () => {
      this.editQuestion = false;
      this.questionsPaginator.searchText = '';
    })
  }

  updateQuestionPaginator() {
    this.questionsPaginator.array = this.allQuestions.map(q => {
      return {
        text: q.text,
        category: this.getCategoryName(q.category_id),
        difficulty: this.getQuestionDifficulty(q.difficulty)
      }
    })
  }

  handleDeleteQuestion(filteredQuestions: any) {
    const question = this.allQuestions.find(q => q.text === filteredQuestions.text);
    this.confirmService.showCustomConfirm(`Are you sure you want to delete question?`, () => {
      this.adminService.deleteQuestion(question.id).subscribe({
        next: (resp: any) => {
          this.snackBarService.showSnackBar(resp.message);
          const index = this.allQuestions.findIndex(q => q.id === question.id);
          if (index) {
            this.allQuestions.splice(index, 1);
          }
          this.updateQuestionPaginator();
        },
        error: (error: any) => {
          // SHOW ERROR PAGE
        }
      })
    });
  }

  getDifficultyColor(item: any) {
    switch (item.difficulty) {
      case 'Easy':
        return 'color: var(--theme-darkblue-green)'
      case 'Medium':
        return 'color: var(--theme-darkblue-orange)'
      default:
        return 'color: var(--theme-darkblue-red)'
    }
  }

  getCategoryName(catId: number) {
    const cat = this.allCategories.filter(c => c.id === catId);
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
          this.updateCategoriesPaginator();
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
          this.updateCategoriesPaginator();
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

  updateCategoriesPaginator() {
    this.categoriesPaginator.array = this.allCategories;
  }

  sortQuestionsByDifficulty() {
    this.allQuestions.sort((a, b) => a.difficulty - b.difficulty);
  }

  ngOnDestroy(): void {
    if (this.adminUserBannedSub) this.adminUserBannedSub.unsubscribe();
    if (this.adminUserUnbannedSub) this.adminUserUnbannedSub.unsubscribe();
    if (this.adminUserDeletedSub) this.adminUserDeletedSub.unsubscribe();
    if (this.adminBanExpired) this.adminBanExpired.unsubscribe();
  }

}

import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Subscription } from 'rxjs';

import { User } from '../../shared/models/User';
import { UserService } from '../../services/shared/user.service';
import { Statistic } from '../../shared/models/Statistic';
import { QuizPlayed } from '../../shared/models/QuizPlayed';
import { QuizService } from '../../services/shared/quiz.service';
import { UtilService } from '../../services/shared/util.service';
import { QuizDetailsComponent } from '../quiz-details/quiz-details.component';
import { WebsocketService } from '../../services/quiz/websocket.service';
import { WSMatchFoundMsg } from '../../shared/models/WSMatchFoundMsg';
import { MatchStateService } from '../../services/quiz/match-state.service';
import { Friend } from '../../shared/models/Friend';
import { UserLeaderBoard } from '../../shared/models/UserLeaderboard';
import { AppComponent } from '../../app.component';
import { FriendsService } from '../../services/friends/friends.service';
import { SnackBarService } from '../../services/shared/snack-bar.service';
import { NotificationService } from '../../services/shared/notification.service';
import { UserSettingsService } from '../../services/dashboard/user-settings.service';


@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('appUserSettingsContainer', { read: ViewContainerRef }) appUserSettingsContainer!: ViewContainerRef;
  @ViewChild('displayQuizQuestionsContainer', { read: ViewContainerRef }) displayQuizQuestionsContainer!: ViewContainerRef;
  @ViewChild('friendRequestIcon') friendRequestIcon!: AppComponent;

  constructor(
    private router: Router,
    private userService: UserService,
    private quizService: QuizService,
    private utilService: UtilService,
    private wsService: WebsocketService,
    private matchStateService: MatchStateService,
    private friendsService: FriendsService,
    private snackBarService: SnackBarService,
    private notificationService: NotificationService,
    private userSettingsService: UserSettingsService
  ) {
    this.errorSub = this.wsService.error$.subscribe((msg) => {
      this.errorMessage = msg;
      this.matchmakingLbl = 'Battle'
      this.isSearching = false;
      console.error('Error: ', msg)
    })
    this.startQuizSub = this.wsService.startQuiz$.subscribe((resp: WSMatchFoundMsg) => {
      this.isSearching = false;
      this.matchmakingLbl = 'Battle'
      this.handleWsMessage(resp);
    })
  }
  user: User = new User();
  userStatistic: Statistic = new Statistic();
  userPlayHistory: QuizPlayed[] = [];
  // LEADRBOARD
  leaderbaord: UserLeaderBoard[] = [];

  // FIRENDS
  FRIENDS_TAB = {
    FRIENDS: 0,
    FRIENDS_REQUEST: 1,
    ADD_FRIEND: 2
  }
  friendsLabel = 'Friends';
  friends: Friend[] = [];
  friendsRequest: Friend[] = [];
  friendsTab: number = 0;

  // SEARCH USER
  searchUserText: string = '';
  suggestedUsers: any[] = [];
  searchUsed: boolean = false;

  // SUBSCRIPTIONS
  private errorSub: Subscription;
  private startQuizSub: Subscription;

  // MATCHMAKING
  matchmakingLbl: string = 'Battle'
  isSearching: boolean = false;

  // MATCHMAKING TIMER
  secondsElapsed = 0;
  timerInterval: any;
  formattedTime = '00:00';

  // SOCKET ERROR
  errorMessage: string | null = null;

  ngOnInit(): void {
    const userId = parseInt(sessionStorage.getItem('userId'), 10);
    // --------- GET USER ---------
    this.userService.getUserById(userId).subscribe({
      next: (resp: any) => {
        this.user = resp;
        this.userSettingsService.setUser(this.user);
        // --------- INITIALIZE WEBSOCKET CONNECTION ---------
        this.wsService.connect();
        this.wsService.connectionOpen$.subscribe(() => {
          this.wsService.sendHello(userId, this.user.username);
        })
      },
      error: (error: any) => {
        console.error(error)
      }
    })
    // --------- GET USER STATISTICS---------
    this.userService.getUserStatisticsById(userId).subscribe({
      next: (resp: any) => {
        this.userStatistic = resp;
      },
      error: (error: any) => {
        console.error(error)
      }
    })
    // --------- GET USER PLAY HISTORY ---------
    this.userService.getUserPlayHistoryById(userId).subscribe({
      next: (resp: any) => {
        const ret: any = (resp as any[]).map((val) => {
          const start = new Date(val.start).getTime();
          const end = new Date(val.end).getTime();
          const duration = (end - start) / 1000;
          return {
            ...val,
            start,
            end,
            duration
          }
        });
        this.userPlayHistory = ret;
      },
      error: (error: any) => {
        console.error(error)
      }
    })
    // --------- GET USER FRIENDS ---------
    this.getFriends(userId);
    this.wsService.refreshFriends$.subscribe((resp: any) => {
      console.log(resp);
      const userIdFrom = resp.userId;
      const action = resp.action;
      if (action !== 'NONE') {
        this.userService.getUserById(userIdFrom).subscribe({
          next: (resp: User) => {
            switch (action) {
              case 'FR_RQ_SENT':
                this.notificationService.showNotification(resp.username + ' has sent you a friend request.')
                break;
              case 'FR_RQ_ACCEPT':
                this.notificationService.showNotification(resp.username + ' has accepted your friend request.')
                break;
            }
          },
          error: (error: any) => {
            console.log(error.error.message)
          }
        })
      }
      this.getFriends(userId);
    })
    // --------- GET LEADERBOARD ---------
    this.userService.getLeaderBoard().subscribe({
      next: (resp: any) => {
        this.leaderbaord = resp;
      },
      error: (error: any) => {

      }
    })
  }

  ngAfterViewInit(): void {
    this.userSettingsService.setContainer(this.appUserSettingsContainer);
  }

  getFriends(userId: number) {
    this.friendsService.getUserFriendsById(userId).subscribe({
      next: (resp: any[]) => {
        console.log(resp);
        this.friends = resp.filter(f => f.accepted);
        this.friendsRequest = resp.filter(f => !f.accepted && f.userIdSent !== userId);
      },
      error: (error: any) => {
        this.friends = [];
        this.friendsRequest = [];
      }
    })
  }

  formatDuration(seconds: number): string {
    return this.utilService.formatDurationToMinSecFromSec(seconds);
  }

  showDetails(item: QuizPlayed) {
    this.userService.getUserQuizQuestionsById(item.user_id, item.quiz_id).subscribe({
      next: (resp: any) => {
        this.displayQuizQuestionsContainer.clear();
        const componentRef = this.displayQuizQuestionsContainer.createComponent(QuizDetailsComponent);
        componentRef.setInput('selectedQuizPlayed', item);
        componentRef.setInput('selectedQuizQuestions', resp)
        componentRef.instance.closed.subscribe(() => {
          componentRef.destroy();
        })
      },
      error: (error: any) => {
        console.error(error)
      }
    })
  }

  getDifficultyLabel(level: number) {
    return this.quizService.getDifficultyLabel(level);
  }

  getDifficultyColor(level: number) {
    return this.quizService.getDifficultyColor(level);
  }

  onBattleClick() {
    if (!this.isSearching) {
      this.matchmakingLbl = 'Cancel'
      this.isSearching = true;
      this.secondsElapsed = 0;
      this.updateFormattedTime();
      this.timerInterval = setInterval(() => {
        this.secondsElapsed++;
        this.updateFormattedTime();
      }, 1000)
      this.wsService.joinMatchmaking(this.user.username);
    }
    else {
      this.matchmakingLbl = 'Battle'
      this.isSearching = false;
      clearInterval(this.timerInterval);
      this.wsService.cancelMatchmaking(this.user.username);
    }
  }

  updateFormattedTime() {
    const minutes = Math.floor(this.secondsElapsed / 60);
    const seconds = this.secondsElapsed % 60;
    this.formattedTime =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  handleWsMessage(msg: WSMatchFoundMsg) {
    if (msg.type === 'battle/MATCH_FOUND') {
      this.matchStateService.setCurrentMatch(msg);
      this.router.navigate(['/quiz/loading-screen'])
    }
  }

  handleFriendTabClick(num: number) {
    this.friendsTab = num;
    switch (this.friendsTab) {
      case this.FRIENDS_TAB.FRIENDS:
        this.friendsLabel = 'Friends';
        break;
      case this.FRIENDS_TAB.FRIENDS_REQUEST:
        this.friendsLabel = 'Friend Requests';
        break;
      case this.FRIENDS_TAB.ADD_FRIEND:
        this.friendsLabel = 'Add Friend'
        break;
    }
  }

  handleSearchUsersClick() {
    if (this.searchUserText.length === 0) return;
    this.userService.getUsersByUsername(this.searchUserText, this.user.username).subscribe({
      next: (resp: any) => {
        this.searchUsed = true;
        let existingFriendsIDs = new Set(this.friends.map(f => f.friendId));
        this.suggestedUsers = (resp as any[]).filter(u => !existingFriendsIDs.has(u.id));
      },
      error: (error: any) => {
        this.searchUsed = true;
      }
    })
  }

  handleRemoveFriendClick(friendId: number) {
    this.friendsService.deleteUserFriendById(this.user.id, friendId).subscribe({
      next: (resp: any) => {
        this.snackBarService.showSnackBar(resp.message)
        this.friends = this.friends.filter(f => f.friendId !== friendId);
      },
      error: (error) => {

      }
    })
  }

  handleSendFriendRequest(id: number) {
    this.friendsService.sendFriendRequest(this.user.id, id).subscribe({
      next: (resp: any) => {
        this.snackBarService.showSnackBar(resp.message);
      },
      error: (error: any) => {
        this.snackBarService.showSnackBar(error.error.message);
      }
    })
  }

  handleAcceptFriendRequest(friend: Friend) {
    this.friendsService.acceptFriendRequest(this.user.id, friend.friendId).subscribe({
      next: (resp: any) => {
        this.friendsRequest = this.friendsRequest.filter(f => f.friendId !== friend.friendId);
        this.friends.push(friend)
        this.snackBarService.showSnackBar(resp.message);
      },
      error: (error: any) => {
        this.snackBarService.showSnackBar(error.error.message);
      }
    })
  }

  handleRejectFriendRequest(id: number) {
    this.friendsService.rejectFriendRequest(this.user.id, id).subscribe({
      next: (resp: any) => {
        this.friendsRequest = this.friendsRequest.filter(f => f.friendId !== id);
        this.snackBarService.showSnackBar(resp.message);
      },
      error: (error: any) => {
        this.snackBarService.showSnackBar(error.error.message);
      }
    })
  }

  ngOnDestroy(): void {
    this.errorSub.unsubscribe();
    this.startQuizSub.unsubscribe();
  }
}

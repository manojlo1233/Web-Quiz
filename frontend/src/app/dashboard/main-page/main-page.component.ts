import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { User } from '../../shared/models/User/User';
import { UserService } from '../../services/shared/user.service';
import { Statistic } from '../../shared/models/User/Statistic';
import { QuizPlayed } from '../../shared/models/Quiz/QuizPlayed';
import { UtilService } from '../../services/shared/util.service';
import { QuizDetailsComponent } from '../quiz-details/quiz-details.component';
import { WebsocketService } from '../../services/quiz/websocket.service';
import { WSMatchFoundMsg } from '../../shared/models/WebSocket/WSMatchFoundMsg';
import { MatchStateService } from '../../services/quiz/match-state.service';
import { Friend } from '../../shared/models/Shared/Friend';
import { Leaderboard } from '../../shared/models/Shared/Leaderboard';
import { AppComponent } from '../../app.component';
import { FriendsService } from '../../services/friends/friends.service';
import { SnackBarService } from '../../services/shared/snack-bar.service';
import { NotificationService } from '../../services/shared/notification.service';
import { ConfirmService } from '../../services/shared/confirm.service';
import { Category } from '../../shared/models/Shared/Category';
import { UrlService } from '../../services/shared/url.service';
import { UserRanking } from '../../shared/models/User/UserRanking';
import { Paginator } from '../../shared/models/Util/Paginator';


@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit, OnDestroy {
  @ViewChild('displayQuizQuestionsContainer', { read: ViewContainerRef }) displayQuizQuestionsContainer!: ViewContainerRef;
  @ViewChild('friendRequestIcon') friendRequestIcon!: AppComponent;

  constructor(
    private router: Router,
    private userService: UserService,
    private utilService: UtilService,
    private wsService: WebsocketService,
    private matchStateService: MatchStateService,
    private friendsService: FriendsService,
    private snackBarService: SnackBarService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService,
    private urlService: UrlService
  ) {
    this.staticUrl = urlService.staticUrl;
    this.errorSub = this.wsService.error$.subscribe((msg) => {
      this.errorMessage = msg;
      this.matchmakingLbl = 'Battle'
      this.isSearching = false;
      console.error('Error: ', msg)
    })
  }

  staticUrl: string;

  user: User = new User();
  userStatistic: Statistic = new Statistic();
  userPlayHistory: QuizPlayed[] = [];
  // LEADRBOARD
  leaderbaord: Leaderboard[] = [];
  leaderBoardCategory: string = 'General';
  leaderBoardRefreshDisabled: boolean = false;
  leaderBoardTimeout = null;
  leaderBoardLoading: boolean = false;

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
  battleFriendCounter: number = 2;
  battleFriendInterval = null;

  // SEARCH USER
  searchUserText: string = '';
  suggestedUsers: any[] = [];
  searchUsed: boolean = false;

  // SUBSCRIPTIONS
  private errorSub: Subscription;
  private startQuizSub: Subscription;
  private connectionSub: Subscription;
  private refreshFriendsSub: Subscription;
  private refreshFriendsStatusSub: Subscription;
  private battleRequestSub: Subscription;
  private battleAcceptSub: Subscription;
  private battleDeclineSub: Subscription;
  private battleWithdrawSub: Subscription;
  private battleAutoWithdrawSub: Subscription;
  private adminUserDeletedSub: Subscription;
  private adminUserBannedSub: Subscription;

  // MATCHMAKING
  matchmakingLbl: string = 'Battle'
  isSearching: boolean = false;
  searchDisabled: boolean = false;
  allCategories: Category[] = [];
  searchCategory: string = 'General';
  // MATCHMAKING TIMER
  secondsElapsed = 0;
  timerInterval: any;
  formattedTime = '00:00';
  // SOCKET ERROR
  errorMessage: string | null = null;
  // USER SETTINGS
  showUserSettings: boolean = false;
  // NOTIFICATIONS
  showNotifications: boolean = false;
  // AVATARS
  showAvailableAvatars: boolean = false;

  // PAGINATOR
  battleHistoryPaginator: Paginator = new Paginator(this.userPlayHistory, 10);

  // NEWS
  news = [
    {
      imageUrl: '/assets/img/news1.jpg',
      title: 'New Tournament Coming!',
      description: 'Prepare for the next big challenge.'
    },
    {
      imageUrl: '/assets/img/news2.jpg',
      title: 'Feature Update',
      description: 'New 50/50 power-up now available!'
    },
    {
      imageUrl: '/assets/img/news3.jpg',
      title: 'Community Spotlight',
      description: 'Check out the top players this month.'
    }
  ];

  newsCurrentSlide = 0;
  newsIntervalId: any;

  // COLORS
  iconPrevPageColor: string = 'var(--theme-color-neutral-2)';
  iconNextPageColor: string = 'white';

  // RANKS
  allRanks: any[] = [];
  userRankings: UserRanking[] = [];
  userRanking: UserRanking = new UserRanking();

  ngOnInit(): void {
    const userId = Number.parseInt(sessionStorage.getItem('userId'));
    // --------- INITIALIZE WEBSOCKET CONNECTION ---------
    this.userService.getUserById(userId).subscribe({
      next: (resp: User) => {
        this.user = resp;
        this.wsService.connect();
        if (this.connectionSub) this.connectionSub.unsubscribe();
        this.connectionSub = this.wsService.connectionOpen$.subscribe(() => {
          this.wsService.sendHello(userId, this.user.username);
        })
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })

    // --------- USER STATISTICS---------
    this.userService.getUserStatisticsById(userId).subscribe({
      next: (resp: any) => {
        this.userStatistic = resp;
      },
      error: (error: any) => {
        console.error(error)
      }
    })
    // --------- USER PLAY HISTORY ---------
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
        this.battleHistoryPaginator.array = this.userPlayHistory.map(elem => {
          return { ...elem, }
        });
      },
      error: (error: any) => {
        console.error(error)
      }
    })
    // --------- USER FRIENDS ---------
    this.getFriends(userId);
    this.refreshFriendsSub = this.wsService.refreshFriends$.subscribe((resp: any) => {
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
    this.refreshFriendsStatusSub = this.wsService.refreshFriendsStatus$.subscribe((resp: any) => {
      this.getFriends(userId);
    })
    // --------- CATEGORIES ---------
    this.utilService.getAllCategories().subscribe({
      next: (resp: Category[]) => {
        this.allCategories = resp;
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })
    // --------- LEADERBOARD ---------
    this.getLeaderboard();
    // --------- START QUIZ ---------
    this.startQuizSub = this.wsService.startQuiz$.subscribe((resp: WSMatchFoundMsg) => {
      this.isSearching = false;
      this.matchmakingLbl = 'Battle'
      this.friends.forEach(f => {
        if (f.battleRequestReceived) {
          this.wsService.sendBattleDecline(this.user.id, f.friendId);
        }
      })
      this.handleWsMessage(resp);
    })
    // --------- BATTLE REQUESTS ---------
    this.battleRequestSub = this.wsService.battleRequest$.subscribe((resp: any) => {
      const friendId = resp.friendId;
      const friend = this.friends.filter(f => f.friendId === friendId)[0];
      friend.battleRequestReceived = true;
      this.notificationService.showNotification(`${friend.username} has sent you a battle request.`)
    })

    this.battleWithdrawSub = this.wsService.battleWithdraw$.subscribe((resp: any) => {
      const friendId = resp.friendId;
      const friend = this.friends.filter(f => f.friendId === friendId)[0];
      friend.battleRequestReceived = false;
      this.notificationService.showNotification(`${friend.username} has withdrawn a battle request.`)
    })

    this.battleDeclineSub = this.wsService.battleDecline$.subscribe((resp: any) => {
      const friendId = resp.friendId;
      const friend = this.friends.filter(f => f.friendId === friendId)[0];
      friend.battleRequestSent = false;
      this.searchDisabled = false;
      this.notificationService.showNotification(`${friend.username} has declined a battle request.`)
    })

    this.battleAutoWithdrawSub = this.wsService.battleAutoWithdraw$.subscribe((resp: any) => {
      this.searchDisabled = false;
      this.friends.filter(f => f.friendId === resp.friendId)[0].battleRequestSent = false;
    })

    this.adminUserDeletedSub = this.wsService.adminUserDeleted$.subscribe((data: any) => {
      this.utilService.setShowMessage('Your account has been deleted. Visit mail for more information.');
      this.router.navigate(['show-message']);
    })

    this.adminUserDeletedSub = this.wsService.adminUserDeleted$.subscribe((data: any) => {
      this.utilService.setShowMessage('Your account has been deleted. Visit mail for more information.');
      this.router.navigate(['show-message']);
    })

    this.adminUserBannedSub = this.wsService.adminUserBanned$.subscribe((data: any) => {
      if (this.isSearching) {
        this.stopBattleSearch();
      }
      this.user.banned_until = data.banned_until;
    })
    // --------- NEWS ---------
    this.startNewsAutoSlide();
    // --------- RANKS ---------
    this.utilService.getAllRanks().subscribe({ // GET ALL RANKS
      next: (resp: any) => {
        this.allRanks = resp;
        this.userService.getUserRankings(userId).subscribe({ // GET USER RANKING
          next: (resp: any) => {
            this.userRankings = resp;
            this.getUserRanking();
          }
        })
      }
    })
  }

  get userRank() {
    if (this.allRanks.length === 0) return '';
    for (let i = this.allRanks.length - 1; i >= 0; i--) {
      if (this.userRanking.score >= this.allRanks[i].score) {
        return this.allRanks[i].rank;
      }
    }
    return this.allRanks[0].rank;
  }

  getUserRanking() {
    const categoryId = this.allCategories.find(c => c.name === this.searchCategory).id;
    this.userRanking = this.userRankings.filter(r => r.categoryId === categoryId)[0];
  }

  onSearchCategoryCelect() {
    this.getUserRanking();
  }

  getFriends(userId: number) {
    this.friendsService.getUserFriendsById(userId).subscribe({
      next: (resp: any[]) => {
        const tmpFriends: Friend[] = resp.filter(f => f.accepted);
        const onlineFriends = tmpFriends.filter(f => f.online);
        const offlineFriends = tmpFriends.filter(f => !f.online);
        const friendsNew: Friend[] = [...onlineFriends, ...offlineFriends];
        friendsNew.forEach(newFriend => {
          const oldFriend = this.friends.filter(f => f.friendId === newFriend.friendId);
          if (oldFriend.length === 0) { // ADD IF NEW USER
            if (newFriend.online) {
              this.friends.unshift(newFriend);
            }
            else {
              this.friends.push(newFriend);
            }
          }
          else { // MOVE IF OLD USER AND ONLINE IS CHANGED
            if (oldFriend[0].online !== newFriend.online) {
              oldFriend[0].online = newFriend.online;
              const index = this.friends.findIndex(el => el.friendId === newFriend.friendId);
              this.friends.splice(index, 1);
              if (oldFriend[0].online) {
                this.friends.unshift(oldFriend[0]);
              }
              else {
                this.friends.push(oldFriend[0]);
              }
            }
          }
        })
        this.friends.forEach(oldFriend => { // DELETE IF USER IS NO LONGER FRIEND
          if (friendsNew.filter(f => f.friendId === oldFriend.friendId).length === 0) {
            const index = this.friends.findIndex(el => el.friendId === oldFriend.friendId);
            this.friends.splice(index, 1);
          }
        })
        this.friendsRequest = resp.filter(f => !f.accepted && f.userIdSent !== userId);
      },
      error: (error: any) => {
        this.friends = [];
        this.friendsRequest = [];
        // GO TO ERROR PAGE
      }
    })
  }

  getLeaderboard() {
    this.leaderBoardLoading = true;
    this.utilService.getLeaderBoard(this.leaderBoardCategory).subscribe({
      next: (resp: any) => {
        this.leaderbaord = resp;
        this.leaderBoardLoading = false;
      },
      error: (error: any) => {
      }
    })
  }

  formatDuration(seconds: number): string {
    return this.utilService.formatDurationToMinSecFromSec(seconds);
  }

  showDetails(item: QuizPlayed) {
    this.userService.getUserQuizDetails(item.quiz_id).subscribe({
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

  onBattleClick() {
    if (!this.isSearching) {
      this.startBattleSearch();
    }
    else {
      this.stopBattleSearch();
    }
  }

  startBattleSearch() {
    this.matchmakingLbl = 'Cancel'
    this.isSearching = true;
    this.secondsElapsed = 0;
    this.updateFormattedTime();
    this.timerInterval = setInterval(() => {
      this.secondsElapsed++;
      this.updateFormattedTime();
      if (this.secondsElapsed === 20) {
        this.wsService.relaxMatchmaking(this.user.id, this.user.username, this.searchCategory, this.userRanking.score);
      }
    }, 1000)
    this.wsService.joinMatchmaking(this.user.id, this.user.username, this.searchCategory, this.userRanking.score);
  }

  stopBattleSearch() {
    this.wsService.cancelMatchmaking(this.user.username);
    this.matchmakingLbl = 'Battle'
    this.isSearching = false;
    clearInterval(this.timerInterval);
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

  handleClearUsersSearchClick() {
    this.searchUserText = '';
    this.suggestedUsers = [];
  }

  handleRemoveFriendClick(friendId: number, username: string) {
    this.confirmService.showCustomConfirm(`Are you sure you want to remove ${username} from friends?`,
      () => {
        this.friendsService.deleteUserFriendById(this.user.id, friendId).subscribe({
          next: (resp: any) => {
            this.snackBarService.showSnackBar(resp.message)
            this.friends = this.friends.filter(f => f.friendId !== friendId);
          },
          error: (error) => {

          }
        })
      }
    )
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
        if (friend.online) {
          this.friends.unshift(friend)
        }
        else {
          this.friends.push(friend)
        }
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

  headerIconClick(type: string) {
    switch (type) {
      case 'settings':
        this.showUserSettings = true;
        break;
      case 'notification':
        this.showNotifications = true;
        break;
      case 'admin-settings':
        const url = '/admin/admin-settings';
        window.open(url, '_blank');
        break;
    }
  }

  closeUserSettings() {
    this.showUserSettings = false;
  }

  getBattleIconColor(friend: Friend) {
    if (friend.battleRequestReceived || friend.battleRequestSent) {
      return 'var(--theme-darkblue-red)';
    }
    else {
      return 'var(--theme-darkblue-color-3)';
    }
  }

  updateLeftMargin(friend: Friend) {
    if (!friend.battleRequestReceived) {
      return '0';
    }
    else {
      return '5px';
    }
  }

  handleBattleFriend(friend: Friend) {
    if (!this.battleFriendInterval) {
      friend.battleRequestSent = true;
      this.searchDisabled = true;
      this.wsService.sendBattleRequest(this.user.id, friend.friendId);
      this.battleFriendInterval = setInterval(() => {
        this.battleFriendCounter--;
        if (this.battleFriendCounter === 0) {
          this.battleFriendCounter = 2;
          clearInterval(this.battleFriendInterval);
          this.battleFriendInterval = null;
        }
      }, 1000)
    }
  }

  handleBattleWithdraw(friend: Friend) {
    this.searchDisabled = false;
    friend.battleRequestSent = false;
    this.wsService.sendBattleWithdraw(this.user.id, friend.friendId);
  }

  handleBattleAccept(friend: Friend) {
    this.matchmakingLbl = 'Battle'
    this.isSearching = false;
    clearInterval(this.timerInterval);
    this.wsService.cancelMatchmaking(this.user.username);
    this.wsService.sendBattleAccept(this.user.id, friend.friendId);
  }

  handleBattleDecline(friend: Friend) {
    friend.battleRequestReceived = false;
    this.wsService.sendBattleDecline(this.user.id, friend.friendId);
  }

  handleEditAvatar() {
    this.showAvailableAvatars = true;
  }

  handleCloseEditAvatar(selectedAvatar: string) {
    if (selectedAvatar !== '') this.user.avatar = selectedAvatar;
    this.showAvailableAvatars = false;
  }

  getBattleOutcome(item: QuizPlayed) {
    if (item.player_left_id === item.user_id) {
      return 'LEFT';
    }
    else {
      return item.user_id === item.winner_id ? 'WIN' : 'LOSE';
    }
  }

  handleLeaderboardCategoryClick(cat: string): void {
    this.leaderBoardCategory = cat;
    this.getLeaderboard();
  }

  handleRefreshLeaderboardClick(): void {
    if (!this.leaderBoardTimeout) {
      this.leaderBoardRefreshDisabled = true;
      this.getLeaderboard();
      this.leaderBoardTimeout = setTimeout(() => {
        this.leaderBoardRefreshDisabled = false;
        clearTimeout(this.leaderBoardTimeout);
        this.leaderBoardTimeout = null;
      }, 3000)
    }
  }

  // ---------------- NEWS ----------------
  startNewsAutoSlide() {
    this.newsIntervalId = setInterval(() => this.nextNewsSlide(), 5000);
  }

  nextNewsSlide() {
    this.newsCurrentSlide = (this.newsCurrentSlide + 1) % this.news.length;
  }

  prevNewsSlide() {
    this.newsCurrentSlide = (this.newsCurrentSlide - 1 + this.news.length) % this.news.length;
  }



  ngOnDestroy(): void {
    if (this.errorSub) this.errorSub.unsubscribe();
    if (this.startQuizSub) this.startQuizSub.unsubscribe();
    if (this.connectionSub) this.connectionSub.unsubscribe();
    if (this.refreshFriendsSub) this.refreshFriendsSub.unsubscribe();
    if (this.refreshFriendsStatusSub) this.refreshFriendsStatusSub.unsubscribe();
    if (this.battleRequestSub) this.battleRequestSub.unsubscribe();
    if (this.battleAcceptSub) this.battleAcceptSub.unsubscribe();
    if (this.battleDeclineSub) this.battleDeclineSub.unsubscribe();
    if (this.battleWithdrawSub) this.battleWithdrawSub.unsubscribe();
    if (this.battleAutoWithdrawSub) this.battleAutoWithdrawSub.unsubscribe();
    if (this.adminUserDeletedSub) this.adminUserDeletedSub.unsubscribe();
    if (this.adminUserBannedSub) this.adminUserBannedSub.unsubscribe();
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.newsIntervalId) clearInterval(this.newsIntervalId);
  }
}

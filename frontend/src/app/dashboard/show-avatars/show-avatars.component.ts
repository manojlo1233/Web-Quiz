import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UtilService } from '../../services/shared/util.service';
import { UserService } from '../../services/shared/user.service';

@Component({
  selector: 'app-show-avatars',
  templateUrl: './show-avatars.component.html',
  styleUrl: './show-avatars.component.css'
})
export class ShowAvatarsComponent implements OnInit, OnChanges {
  @Output() closeAvatars = new EventEmitter<string>();
  @Input() userId: number;
  @Input() userAvatar: string;
  constructor(
    private utilService: UtilService,
    private userService: UserService
  ) { }

  avatars: string[] = [];
  selectedAvatar: string = null;

  ngOnChanges(changes: SimpleChanges): void {
    this.selectedAvatar = this.userAvatar;
  }

  ngOnInit(): void {
    this.utilService.getAvailableAvatars().subscribe({
      next: (resp: string[]) => {
        this.avatars = resp;
      },
      error: (error: any) => {
        // SHOW ERROR MESSAGE
      }
    })
  }

  changeAvatar(avatar: string) {
    this.selectedAvatar = avatar;
  }

  save() {
    this.userService.updateUserAvatar(this.userId, this.selectedAvatar).subscribe({
      next: (resp: any) => {
        this.close(this.selectedAvatar);
      },
      error: (error: any) => {
        // SHOW ERROR PAGE
      }
    })
  }

  close(emitValute: string) {
    this.closeAvatars.emit(emitValute);
  }

}

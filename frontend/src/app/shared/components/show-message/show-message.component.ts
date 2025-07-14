import { Component, Input, OnInit } from '@angular/core';
import { WebsocketService } from '../../../services/quiz/websocket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-show-message',
  templateUrl: './show-message.component.html',
  styleUrl: './show-message.component.css'
})
export class ShowMessageComponent implements OnInit {
  @Input() message: string = ''

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {

  }

  onLogin() {
    this.router.navigate([''])
  }

}

import { Injectable } from '@angular/core';
import { WsMessage } from '../../shared/models/WsMessage';

@Injectable({
  providedIn: 'root'
})
export class MatchStateService {

  private currentMatch: WsMessage | null = null;

  constructor() { }

  setCurrentMatch(match: WsMessage): void {
    this.currentMatch = match;
  }

  getCurrentMatch(): WsMessage | null {
    return this.currentMatch;
  }
}

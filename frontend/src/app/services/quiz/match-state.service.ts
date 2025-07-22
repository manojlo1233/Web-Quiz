import { Injectable } from '@angular/core';
import { WSMatchFoundMsg } from '../../shared/models/WebSocket/WSMatchFoundMsg';

@Injectable({
  providedIn: 'root'
})
export class MatchStateService {

  private currentMatch: WSMatchFoundMsg | null = null;

  constructor() { }

  setCurrentMatch(match: WSMatchFoundMsg): void {
    this.currentMatch = match;
  }

  getCurrentMatch(): WSMatchFoundMsg | null {
    return this.currentMatch;
  }
}

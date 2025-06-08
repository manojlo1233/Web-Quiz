import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UrlService } from '../shared/url.service';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  private url: string;

  constructor(
    private http: HttpClient,
    private urlService: UrlService
  ) {
    this.url = `${urlService.url}/friends`
  }

  getUserFriendsById(userId: number) {
    return this.http.get(`${this.url}/getUserFriendsById/${userId}`)
  }
  
  deleteUserFriendById(userId: number, friendId: number) {
    return this.http.delete(`${this.url}/deleteUserFriendById/${userId}/${friendId}`)
  }

}

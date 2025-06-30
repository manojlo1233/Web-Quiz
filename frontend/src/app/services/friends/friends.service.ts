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

  sendFriendRequest(userId: number, friendId: number) {
    const body = { userId, friendId };
    return this.http.post(`${this.url}/sendFriendRequest`, body);
  }

  acceptFriendRequest(userId: number, friendId: number) {
    const body = { userId, friendId };
    return this.http.put(`${this.url}/acceptFriendRequest`, body);
  }

  rejectFriendRequest(userId: number, friendId: number) {
    return this.http.delete(`${this.url}/rejectFriendRequest/${userId}/${friendId}`)
  }

  getUserFriendsOnlineStatus(userFriends: any[]) {
    const body = {
      userFriends
    };
    return this.http.post(`${this.url}/getUserFriendsOnlineStatus`, body);
  }
}

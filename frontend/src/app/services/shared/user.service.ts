import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private url: string = 'http://localhost:3000/api/users'

  constructor(
    private http: HttpClient
  ) { }

  getUserById(id: number) {
    return this.http.get(`${this.url}/getUserById/${id}`);
  }

  getUserStatisticsById(id: number) {
    return this.http.get(`${this.url}/getUserStatisticsById/${id}`);
  }
}

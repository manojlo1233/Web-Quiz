import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  url: string = 'http://192.168.19.62:3000/api';
  constructor() { }
}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  url: string = 'http://localhost:3000/api';
  staticUrl: string = 'http://localhost:3000/static'
  constructor() { }
}

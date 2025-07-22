import { ElementRef, Injectable, Renderer2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {

  hours = Array(24).fill(0).map((_, i) => {
    if (i < 10) {
      return '0' + i;
    }
    else return i.toString();
  });
  minutes = Array(60).fill(0).map((_, i) => {
    if (i < 10) {
      return '0' + i;
    }
    else return i.toString();
  });

  constructor() { }

  checkDate(
    date: string,
    hours: string,
    minutes: string,
    renderer: Renderer2,
    dateRef: ElementRef
  ) {
    let dateValid = false;
    let currentDate = new Date(Date.now());

    if (date !== '' && Number.isNaN(this.parseDate(date + " 00:00:00"))) {
      renderer.setStyle(dateRef.nativeElement, 'border', '1px solid var(--theme-darkblue-red)');
      renderer.setStyle(dateRef.nativeElement, 'box-shadow', '0 0 2px 1px var(--theme-darkblue-red)')
      dateValid = false;
    }
    else {
      renderer.setStyle(dateRef.nativeElement, 'border', '1px solid transparent');
      renderer.setStyle(dateRef.nativeElement, 'box-shadow', 'none')
      dateValid = true;
    }
    if (currentDate >= (this.parseDate(`${date} ${hours}:${minutes}:00`) as Date)) {
      dateValid = false;
    }
    if (dateValid) {
      return true;
    }
    else return false;
  }

  parseDate(str: string) {
    try {
      let regex = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
      let match = str.match(regex);
      if (match === null) { // POKRIVAMO SLUCAJEVE KADA KORISNIK RUCNO UNESE DATUM, ZA DANOM ILI MESECOM SA JEDNIM KARAKTEROM
        regex = /^(\d{1})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
        match = str.match(regex);
        if (match === null) {
          regex = /^(\d{2})\.(\d{1})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
          match = str.match(regex);
          if (match === null) {
            regex = /^(\d{1})\.(\d{1})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
            match = str.match(regex);
          }
        }
      }
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // Meseci u JS su od 0 do 11
      const year = parseInt(match[3], 10);
      const hours = parseInt(match[4], 10);
      const minutes = parseInt(match[5], 10);
      const seconds = parseInt(match[6], 10);

      // Kreiraj novi Date objekat
      const date = new Date(year, month, day, hours, minutes, seconds);

      // Provera da li je datum validan
      return isNaN(date.getTime()) ? NaN : date;
    }
    catch (error) {
      return Number.NaN
    }
  }

  convertDateToMysqlDateTime(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  convertDateToEuropeDate(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${date.getDate()}.${pad(date.getMonth() + 1)}.${pad(date.getFullYear()).toString().slice(2)} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

}

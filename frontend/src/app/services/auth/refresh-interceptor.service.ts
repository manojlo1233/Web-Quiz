import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RefreshInterceptor implements HttpInterceptor {
  private refreshing = false;
  private waiters: ((t: string) => void)[] = [];

  constructor(private http: HttpClient, private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError(err => {
        if (err.status !== 401) return throwError(() => err);

        if (req.url.includes('/auth/loginUser') ||
          req.url.includes('/auth/registerUser') ||
          req.url.includes('/auth/logoutUser') ||
          req.url.includes('/auth/requestPasswordReset') ||
          req.url.includes('/auth/resetPassword')
          ) {
          return throwError(() => err);
        }

        if (this.refreshing) {
          return new Observable<HttpEvent<any>>(observer => {
            this.waiters.push((newToken) => {
              const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              next.handle(retried).subscribe(observer);
            });
          });
        }

        this.refreshing = true;

        return this.http.post<{ accessToken: string }>(
          '/auth/refresh', {}, { withCredentials: true }
        ).pipe(
          switchMap(({ accessToken }) => {
            sessionStorage.setItem('accessToken', accessToken);
            this.waiters.forEach(w => w(accessToken));
            this.waiters = [];
            this.refreshing = false;

            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
            return next.handle(retried);
          }),
          catchError(refreshErr => {
            this.refreshing = false;
            this.waiters = [];
            sessionStorage.removeItem('accessToken');
            this.router.navigate([''])
            return throwError(() => refreshErr);
          })
        );
      })
    );
  }
}

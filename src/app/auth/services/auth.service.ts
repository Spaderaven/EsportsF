import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environments';
import { AuthStatus, CheckTokenResponse, LoginResponse, User } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly baseUrl = environment.baseUrl;
  private http = inject( HttpClient );

  private _currentUser = signal<User|null>(null);
  private _authStatus = signal<AuthStatus>( AuthStatus.checking );

  public currentUser = computed( ()=> this._currentUser() );
  public authStatus = computed( ()=> this._authStatus() );



  constructor() {
    this.checkAuthStatus().subscribe();
  }


  private setAuthentication(user: User, token: string): boolean {

    console.log("SET AUTH TOKEN", token);

    this._currentUser.set( user );
    this._authStatus.set( AuthStatus.authenticated );
    localStorage.setItem('token', token);

    return true;
  }


  login( email: string, password: string ): Observable<boolean> {

    const url = `${this.baseUrl}/auth/login`;
    const body = { email, password };

    return this.http.post<LoginResponse>( url, body )
    .pipe(
      map( ({ user, token }) => this.setAuthentication( user, token ) ),

      //Handles errors
      catchError( err => throwError(() => err.error.message ) )

      );

  }


  checkAuthStatus(): Observable<boolean> {

    const url = `${this.baseUrl}/auth/check-token`;
    const token = localStorage.getItem('token');

    if (!token) {
      this.logout();
      return of(false);
    }

    console.log("TOKEN", token);


    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`);

      return this.http.get<CheckTokenResponse>( url, { headers } )
        .pipe(
          map( ({ user, token }) => this.setAuthentication( user, token ) ),

          // Error handling
          catchError( (err) => {
            console.log("Error", err);
            this._authStatus.set( AuthStatus.notAuthenticated );
            console.log("CHECK STATUS TOKEN", token);
            return of(false)
          })
        );

  }


  logout(): void {
    this._currentUser.set( null );
    this._authStatus.set( AuthStatus.notAuthenticated );
    localStorage.removeItem('token');
  }


  createAccount( nickname:string, email: string, password: string ): Observable<boolean> {

    const url = `${this.baseUrl}/auth/register`;
    const body = { email, password, nickname };

    console.log("BODY", body);

    return this.http.post<LoginResponse>( url, body )
    .pipe(
      map( ({ user, token }) => this.setAuthentication( user, token ) ),

      //Handles errors
      catchError( err => throwError(() => err.error.message ) )

      );

  }

}

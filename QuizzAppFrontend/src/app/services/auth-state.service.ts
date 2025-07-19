import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private usernameSubject = new BehaviorSubject<string>('');

  isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();
  username$: Observable<string> = this.usernameSubject.asObservable();

  constructor() {
    this.checkInitialAuthState();
  }

  private checkInitialAuthState(): void {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username') || '';
    
    if (token) {
      this.isAuthenticatedSubject.next(true);
      this.usernameSubject.next(username);
    }
  }

  login(username: string): void {
    localStorage.setItem('username', username);
    this.isAuthenticatedSubject.next(true);
    this.usernameSubject.next(username);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    this.isAuthenticatedSubject.next(false);
    this.usernameSubject.next('');
  }
}
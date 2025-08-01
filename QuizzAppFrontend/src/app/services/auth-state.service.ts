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

  login(username: string, userId: number): void {
    localStorage.setItem('username', username);
    localStorage.setItem('userId', userId.toString());
    this.isAuthenticatedSubject.next(true);
    this.usernameSubject.next(username);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    this.isAuthenticatedSubject.next(false);
    this.usernameSubject.next('');
  }

  getUsername(): string {
    return this.usernameSubject.value || localStorage.getItem('username') || '';
  }

  getUserId(): number {
    const id = localStorage.getItem('userId');
    return id ? +id : 0;
  }
}
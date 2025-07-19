import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthStateService } from './auth-state.service';

interface LoginResponse {
  token: string;
  expiration: string;
}

interface RegistrationData {
  username: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'https://localhost:7039/api/auth';
  private readonly TOKEN_KEY = 'authToken';

  constructor(
    private http: HttpClient,
    private authState: AuthStateService
  ) { }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      username,
      password
    }).pipe(
      tap(response => {
        this.setToken(response.token);
        this.authState.login(username);
      })
    );
  }

  register(userData: RegistrationData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    this.clearToken();
    this.authState.logout();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
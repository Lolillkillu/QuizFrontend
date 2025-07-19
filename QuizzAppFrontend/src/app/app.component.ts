import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStateService } from './services/auth-state.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'QuizzAppFrontend';
  isAuthenticated = false;
  username = '';

  constructor(
    private authState: AuthStateService,
    private authService: AuthService
  ) {
    this.authState.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    this.authState.username$.subscribe(username => {
      this.username = username;
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
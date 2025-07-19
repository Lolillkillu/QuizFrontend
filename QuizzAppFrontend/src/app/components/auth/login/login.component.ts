import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials = {
    username: '',
    password: ''
  };
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.authService.login(this.credentials.username, this.credentials.password)
      .subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token);
          this.router.navigate(['/']);
          this.isLoading = false;
        },
        error: (error) => {
          if (error.status === 401) {
            this.errorMessage = 'Nieprawidłowa nazwa użytkownika lub hasło';
          } else {
            this.errorMessage = 'Bląd serwera Spróbuj ponownie później';
          }
          this.isLoading = false;
        }
      });
  }
}
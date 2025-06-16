import { Component } from '@angular/core';
import { QuizService } from '../../services/quiz.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-deletequiz',
  templateUrl: './deletequiz.component.html',
  styleUrls: ['./deletequiz.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class DeleteQuizComponent {
  deleteForm = new FormGroup({
    quizIdControl: new FormControl('')
  });
  
  message: string = '';
  isError: boolean = false;

  get quizIdControl() {
    return this.deleteForm.get('quizIdControl');
  }

  constructor(
    private quizService: QuizService,
    private router: Router
  ) {}

  onSubmit() {
    const id = Number(this.quizIdControl?.value);
    
    if (!id) {
      this.showError('Proszę wprowadzić prawidłowe ID quizu');
      return;
    }

    this.quizService.deleteQuiz(id).subscribe({
      next: () => {
        this.showSuccess('Quiz został pomyślnie usunięty');
        setTimeout(() => this.router.navigate(['/quizzes']), 2000);
      },
      error: (err) => {
        const message = err.status === 404 
          ? 'Nie znaleziono quizu o podanym ID' 
          : 'Wystąpił błąd podczas usuwania quizu';
        this.showError(message);
      }
    });
  }

  private showSuccess(message: string): void {
    this.message = message;
    this.isError = false;
  }

  private showError(message: string): void {
    this.message = message;
    this.isError = true;
  }
}
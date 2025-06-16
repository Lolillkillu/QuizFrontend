import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-addquestion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule
  ],
  templateUrl: './addquestion.component.html',
  styleUrls: ['./addquestion.component.css']
})
export class AddQuestionComponent {
  questionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {
    this.questionForm = this.fb.group({
      questionText: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  get quizId(): number {
    return Number(this.route.snapshot.paramMap.get('quizId'));
  }

  onSubmit() {
    if (this.questionForm.valid) {
      this.quizService.addQuestionToQuiz(
        this.quizId,
        this.questionForm.get('questionText')?.value
      ).subscribe({
        next: () => this.router.navigate(['/quizzes']),
        error: (error) => console.error('Error:', error)
      });
    }
  }
}
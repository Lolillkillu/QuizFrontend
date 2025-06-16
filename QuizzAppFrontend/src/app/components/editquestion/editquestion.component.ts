import { Component, OnInit } from '@angular/core';
import { Question } from '../../models/question.model';
import { QuizService } from '../../services/quiz.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-edit-question',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './editquestion.component.html',
  styleUrls: ['./editquestion.component.css']
})
export class EditQuestionComponent implements OnInit {
  questionForm!: FormGroup;
  isLoading = true;
  error?: string;

  constructor(
    private fb: FormBuilder,
    private quizService: QuizService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const questionId = +this.route.snapshot.params['questionId'];
    const quizId = +this.route.snapshot.params['quizId'];

    this.quizService.getQuiz(quizId).subscribe(quiz => {
      const question = quiz.questions.find(q => q.questionId === questionId);
      if (question) {
        this.initForm(question);
        this.isLoading = false;
      } else {
        this.error = 'Nie ma takiego pytania';
        this.isLoading = false;
      }
    });
  }

  private initForm(question: Question) {
    this.questionForm = this.fb.group({
      question: [question.question, Validators.required]
    });
  }

  onSubmit() {
    if (this.questionForm.valid) {
      const updatedQuestion = {
        ...this.questionForm.value,
        questionId: +this.route.snapshot.params['questionId'],
        quizzId: +this.route.snapshot.params['quizId']
      };

      this.quizService.updateQuestion(updatedQuestion.questionId, updatedQuestion)
        .subscribe({
          next: () => this.router.navigate(['/quizzes', updatedQuestion.quizzId]),
          error: (err) => this.error = 'Błąd podczas edytowaia pytania'
        });
    }
  }

  onCancel() {
    const quizId = +this.route.snapshot.params['quizId'];
    this.router.navigate(['/quizzes', quizId]);
  }
}
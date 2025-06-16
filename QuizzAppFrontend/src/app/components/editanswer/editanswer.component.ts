import { Component, OnInit } from '@angular/core';
import { Answer } from '../../models/answer.model';
import { QuizService } from '../../services/quiz.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-edit-answer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './editanswer.component.html',
  styleUrls: ['./editanswer.component.css']
})
export class EditAnswerComponent implements OnInit {
  answerForm!: FormGroup;
  isLoading = true;
  error?: string;

  constructor(
    private fb: FormBuilder,
    private quizService: QuizService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const answerId = +this.route.snapshot.params['answerId'];
    const quizId = +this.route.snapshot.params['quizId'];
    const questionId = +this.route.snapshot.params['questionId'];

    this.quizService.getQuiz(quizId).subscribe(quiz => {
      const question = quiz.questions.find(q => q.questionId === questionId);
      const answer = question?.answers.find(a => a.answerId === answerId);
      
      if (answer) {
        this.initForm(answer);
        this.isLoading = false;
      } else {
        this.error = 'nie ma takiej odpowiedzi';
        this.isLoading = false;
      }
    });
  }

  private initForm(answer: Answer) {
    this.answerForm = this.fb.group({
      answer: [answer.answer, Validators.required],
      isCorrect: [answer.isCorrect]
    });
  }

  onSubmit() {
    if (this.answerForm.valid) {
      const updatedAnswer = {
        ...this.answerForm.value,
        answerId: +this.route.snapshot.params['answerId'],
        questionId: +this.route.snapshot.params['questionId']
      };

      this.quizService.updateAnswer(updatedAnswer.answerId, updatedAnswer)
        .subscribe({
          next: () => this.router.navigate(['/quizzes', this.route.snapshot.params['quizId']]),
          error: (err) => this.error = 'błąd podcząs edytowania odpowiedzi'
        });
    }
  }

  onCancel() {
    this.router.navigate(['/quizzes', this.route.snapshot.params['quizId']]);
  }
}
import { Component, OnInit } from '@angular/core';
import { QuizService } from '../../services/quiz.service';
import { CreateQuiz } from '../../models/createquiz.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Answer } from '../../models/answer.model';
import { AuthStateService } from '../../services/auth-state.service';
import { ScienceModel } from '../../models/quiz.model';

@Component({
  selector: 'app-createquiz-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './createquiz-form.component.html',
  styleUrls: ['./createquiz-form.component.css']
})
export class CreateQuizFormComponent implements OnInit {
  currentStep: number = 1;

  quizzData: CreateQuiz = {
    Title: '',
    Description: '',
    ScienceId: 0,
    Author: ''
  };

  sciences: ScienceModel[] = [];
  questionText: string = '';
  answers: Partial<Answer>[] = [];
  newAnswer: Partial<Answer> = {
    answer: '',
    isCorrect: false
  };

  isLoading: boolean = false;
  errorMessage: string = '';
  createdQuizId!: number;
  createdQuestionId!: number;

  constructor(
    private quizService: QuizService,
    private authState: AuthStateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.quizzData.Author = this.authState.getUsername();
    this.loadSciences();
  }

  loadSciences() {
    this.quizService.getSciences().subscribe({
      next: (data) => {
        this.sciences = data;
      },
      error: () => this.handleError('Nie udało się pobrać listy nauk')
    });
  }

  submitQuiz() {
    this.isLoading = true;
    this.quizService.createQuiz(this.quizzData).subscribe({
      next: (quiz) => {
        this.createdQuizId = quiz.quizzId;
        this.currentStep = 2;
        this.isLoading = false;
      },
      error: () => this.handleError('Błąd podczas tworzenia quizu')
    });
  }

  submitQuestion() {
    this.isLoading = true;
    this.quizService.addQuestionToQuiz(this.createdQuizId, this.questionText)
      .subscribe({
        next: (question) => {
          this.createdQuestionId = question.questionId;
          this.currentStep = 3;
          this.isLoading = false;
        },
        error: () => this.handleError('Błąd podczas dodawania pytania')
      });
  }

  addAnswer() {
    if (this.newAnswer.answer?.trim()) {
      this.answers.push({...this.newAnswer});
      this.newAnswer = { answer: '', isCorrect: false };
    }
  }

  removeAnswer(index: number) {
    this.answers.splice(index, 1);
  }

  submitAnswers() {
    if (this.answers.length < 4 || !this.answers.some(a => a.isCorrect)) {
      this.errorMessage = 'Wymagane minimum 4 odpowiedzi z przynajmniej jedną poprawną';
      return;
    }

    this.isLoading = true;
    const answersToSend = this.answers.map(a => ({
      answer: a.answer,
      isCorrect: a.isCorrect
    }));

    this.quizService.addAnswersToQuestion(this.createdQuestionId, answersToSend)
      .subscribe({
        next: () => {
          this.router.navigate(['/quizzes', this.createdQuizId]);
        },
        error: (err) => {
          this.errorMessage = 'Błąd zapisywania odpowiedzi: ' + err.message;
          this.isLoading = false;
        }
      });
  }

  private handleError(message: string) {
    this.errorMessage = message;
    this.isLoading = false;
  }
}
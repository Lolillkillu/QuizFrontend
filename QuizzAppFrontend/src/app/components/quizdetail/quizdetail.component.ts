import { Component, OnInit } from '@angular/core';
import { QuizService } from '../../services/quiz.service';
import { Quiz, ScienceModel } from '../../models/quiz.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Question } from '../../models/question.model';
import { Answer } from '../../models/answer.model';
import { forkJoin, of, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quiz-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './quizdetail.component.html',
  styleUrls: ['./quizdetail.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class QuizDetailComponent implements OnInit {
  quiz?: Quiz;
  isLoading = true;
  error?: string;

  isEditing = false;
  editedTitle = '';
  editedDescription = '';
  editedScienceId: number | null = null;
  sciences: ScienceModel[] = [];

  constructor(
    private quizService: QuizService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.quizService.getQuiz(id).subscribe({
        next: (data) => {
          this.quiz = data;
          this.editedTitle = data.title;
          this.editedDescription = data.description ?? '';
          this.editedScienceId = data.scienceId ?? null;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Nie znaleziono quizu';
          this.isLoading = false;
        }
      });
    });

    this.quizService.getSciences().subscribe(sciences => {
      this.sciences = sciences;
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.quiz) {
      this.editedTitle = this.quiz.title;
      this.editedDescription = this.quiz.description ?? '';
      this.editedScienceId = this.quiz.scienceId ?? null;
    }
  }

  saveChanges() {
    if (!this.quiz) return;

    this.quizService.updateQuiz(this.quiz.quizzId, {
      quizzId: this.quiz.quizzId,
      title: this.editedTitle,
      description: this.editedDescription,
      scienceId: this.editedScienceId,
      author: this.quiz.author
    }).subscribe({
      next: () => {
        this.quiz!.title = this.editedTitle;
        this.quiz!.description = this.editedDescription;
        this.quiz!.scienceId = this.editedScienceId;
        this.isEditing = false;
      },
      error: (err) => {
        console.error('Błąd podczas zapisywania zmian:', err);
        alert('Nie udało się zapisać zmian.');
      }
    });
  }

  deleteAnswer(question: Question, answer: Answer) {
    if (confirm('Czy na pewno chcesz usunąć tą odpowiedź?')) {
      this.quizService.deleteAnswer(answer.answerId).subscribe({
        next: () => {
          const index = question.answers.indexOf(answer);
          if (index > -1) {
            question.answers.splice(index, 1);
          }
        },
        error: (err) => {
          console.error('Błąd podczas usuwania odpowiedzi:', err);
        }
      });
    }
  }

  deleteQuestion(questionId: number) {
    if (confirm('Czy na pewno chcesz usunąć to pytanie i wszystkie powiązane odpowiedzi?')) {
      const question = this.quiz?.questions.find(q => q.questionId === questionId);
      if (!question) return;

      const deleteAnswersObservables = question.answers.map(answer =>
        this.quizService.deleteAnswer(answer.answerId)
      );

      if (deleteAnswersObservables.length === 0) {
        this.deleteQuestionRequest(questionId);
        return;
      }

      forkJoin(deleteAnswersObservables).subscribe({
        next: () => {
          this.deleteQuestionRequest(questionId);
        },
        error: (err) => {
          console.error('Błąd podczas usuwania odpowiedzi:', err);
        }
      });
    }
  }

  deleteQuiz() {
    if (confirm('Czy na pewno chcesz usunąć ten quiz? Ta operacja usunie również wszystkie powiązane pytania i odpowiedzi')) {
      if (!this.quiz) return;

      const quizId = this.quiz.quizzId;

      const answersToDelete = this.quiz.questions.flatMap(q =>
        q.answers.map(a => a.answerId)
      );
      const questionsToDelete = this.quiz.questions.map(q => q.questionId);

      const deleteAnswers$ = answersToDelete.length > 0
        ? forkJoin(answersToDelete.map(id => this.quizService.deleteAnswer(id)))
        : of([]);

      deleteAnswers$.pipe(
        switchMap(() => {
          const deleteQuestions$ = questionsToDelete.length > 0
            ? forkJoin(questionsToDelete.map(id => this.quizService.deleteQuestion(id)))
            : of([]);
          return deleteQuestions$;
        }),
        switchMap(() => this.quizService.deleteQuiz(quizId))
      ).subscribe({
        next: () => {
          this.router.navigate(['/quizzes']);
        },
        error: (err) => {
          console.error('Błąd podczas usuwania quizu:', err);
          this.error = 'Wystąpił błąd podczas usuwania quizu';
        }
      });
    }
  }

  private deleteQuestionRequest(questionId: number) {
    this.quizService.deleteQuestion(questionId).subscribe({
      next: () => {
        if (this.quiz) {
          const index = this.quiz.questions.findIndex(q => q.questionId === questionId);
          if (index > -1) {
            this.quiz.questions.splice(index, 1);
          }
        }
      },
      error: (err) => {
        console.error('Błąd podczas usuwania pytania:', err);
      }
    });
  }
}
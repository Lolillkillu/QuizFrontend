import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { QuestionSearchResult, QuestionWithAnswers, Quiz, SubmitGameResult } from '../models/quiz.model';
import { CreateQuiz } from '../models/createquiz.model';
import { Question } from '../models/question.model';
import { Answer } from '../models/answer.model';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private apiUrl = 'https://localhost:7039/api/Quizz';

  constructor(private http: HttpClient) { }

  getQuizzes(): Observable<Quiz[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => response.$values)
    );
  }

  createQuiz(quizData: CreateQuiz): Observable<Quiz> {
    return this.http.post<Quiz>(this.apiUrl, quizData);
  }

  addQuestionToQuiz(quizId: number, questionText: string): Observable<Question> {
    const url = `${this.apiUrl}/${quizId}/Question`;
    return this.http.post<Question>(url, { question: questionText });
  }

  deleteQuiz(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getQuiz(id: number): Observable<Quiz> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(quizzResponse => ({
        ...quizzResponse,
        questions: quizzResponse.questions?.$values?.map((question: any) => ({
          ...question,
          answers: question.answers?.$values || []
        })) || []
      }))
    );
  }

  addAnswersToQuestion(questionId: number, answers: Partial<Answer>[]): Observable<any> {
    const url = `${this.apiUrl}/Question/${questionId}/Answer`;

    const requests = answers.map(answer =>
      this.http.post<Answer>(url, {
        answer: answer.answer,
        isCorrect: answer.isCorrect
      })
    );

    return forkJoin(requests);
  }

  updateQuestion(questionId: number, question: Question): Observable<any> {
    return this.http.put(`${this.apiUrl}/Question/${questionId}`, question);
  }

  updateAnswer(answerId: number, answer: Answer): Observable<any> {
    return this.http.put(`${this.apiUrl}/Answer/${answerId}`, answer);
  }

  deleteAnswer(answerId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Answer/${answerId}`);
  }

  deleteQuestion(questionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Question/${questionId}`);
  }

  getRandomQuestions(quizId: number, numberOfQuestions: number = 10): Observable<any> {
    const url = `${this.apiUrl}/GetRandomQuestions/${quizId}?numberOfQuestions=${numberOfQuestions}`;
    return this.http.get<any>(url);
  }

  getRandomMultiQuestions(
    quizId: number,
    numberOfQuestions: number,
    answersPerQuestion: number
  ): Observable<any> {
    const url = `${this.apiUrl}/GetRandomMultiQuestions/${quizId}?numberOfQuestions=${numberOfQuestions}&answersPerQuestion=${answersPerQuestion}`;
    return this.http.get<any>(url);
  }

  searchQuestions(searchTerm: string): Observable<QuestionSearchResult[]> {
    if (!searchTerm || searchTerm.trim().length < 3) {
      return of([]);
    }

    const url = `${this.apiUrl}/SearchQuestions?searchTerm=${encodeURIComponent(searchTerm)}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.$values && Array.isArray(response.$values)) {
          return response.$values.map((item: any) => ({
            questionId: item.questionId || item.QuestionId,
            questionText: item.questionText || item.QuestionText,
            quizzId: item.quizzId || item.QuizzId,
            quizzTitle: item.quizzTitle || item.QuizzTitle
          }));
        }
        else if (Array.isArray(response)) {
          return response.map(item => ({
            questionId: item.questionId || item.QuestionId,
            questionText: item.questionText || item.QuestionText,
            quizzId: item.quizzId || item.QuizzId,
            quizzTitle: item.quizzTitle || item.QuizzTitle
          }));
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  submitGameResults(results: SubmitGameResult): Observable<any> {
    const url = `${this.apiUrl}/submit-results`;
    return this.http.post(url, results);
  }
}
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { QuestionWithAnswers, Quiz } from '../models/quiz.model';
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

getRandomQuestions(quizId: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/GetRandomQuestions/${quizId}`);
}
}
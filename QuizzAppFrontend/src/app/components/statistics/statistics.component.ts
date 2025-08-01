import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizService } from '../../services/quiz.service';
import { AuthStateService } from '../../services/auth-state.service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {
  userId: number = 0;
  quizHistory: any[] = [];
  scienceSummary: any[] = [];
  quizSummaries: any[] = [];
  expandedQuizId: number | null = null;

  constructor(
    private quizService: QuizService,
    private authState: AuthStateService
  ) { }

  ngOnInit(): void {
    this.userId = this.authState.getUserId();
    this.loadUserStatistics();
  }

  loadUserStatistics(): void {
    if (this.userId) {
      this.quizService.getUserStatistics(this.userId).subscribe({
        next: (data) => {
          this.quizHistory = data.quizHistory.$values || [];
          this.scienceSummary = data.scienceSummary.$values || [];
          this.createQuizSummaries();
        },
        error: (err) => console.error('Błąd podczas pobierania statystyk', err)
      });
    }
  }

  createQuizSummaries(): void {
    const summaryMap = new Map<number, any>();

    for (const attempt of this.quizHistory) {
      if (!summaryMap.has(attempt.quizId)) {
        summaryMap.set(attempt.quizId, {
          quizId: attempt.quizId,
          quizTitle: attempt.quizTitle,
          totalAttempts: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          attempts: []
        });
      }
      
      const summary = summaryMap.get(attempt.quizId);
      summary.totalAttempts++;
      summary.totalCorrect += attempt.correctAnswers;
      summary.totalQuestions += attempt.totalQuestions;
      summary.attempts.push(attempt);
    }

    summaryMap.forEach(summary => {
      summary.overallPercentage = (summary.totalCorrect / summary.totalQuestions) * 100;
    });

    this.quizSummaries = Array.from(summaryMap.values())
      .sort((a, b) => b.quizId - a.quizId);
  }

  toggleQuiz(quizId: number): void {
    this.expandedQuizId = this.expandedQuizId === quizId ? null : quizId;
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  formatPercentage(value: number): string {
    return value.toFixed(2);
  }
}
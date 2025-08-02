import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizService } from '../../services/quiz.service';
import { AuthStateService } from '../../services/auth-state.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas', { static: false }) donutCanvas!: ElementRef<HTMLCanvasElement>;

  userId = 0;
  quizHistory: any[] = [];
  scienceSummary: any[] = [];
  quizSummaries: any[] = [];
  expandedQuizId: number | null = null;
  selectedQuizIds = new Set<number>();
  chart: Chart | null = null;
  donutChart: Chart | null = null;

  colorPalette = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#7AC142', '#FF6B6B', '#4ECDC4'
  ];

  constructor(
    private quizService: QuizService,
    private authStateService: AuthStateService
  ) {}

  ngOnInit(): void {
    this.userId = this.authStateService.getUserId();
    this.loadUserStatistics();
  }

  loadUserStatistics(): void {
    if (!this.userId) return;
    this.quizService.getUserStatistics(this.userId).subscribe({
      next: data => {
        this.quizHistory = data.quizHistory.$values || [];
        this.scienceSummary = data.scienceSummary.$values || [];
        this.createQuizSummaries();
        this.updateChart();
        this.createDonutChart();
      },
      error: err => console.error('Błąd podczas pobierania statystyk', err)
    });
  }

  createQuizSummaries(): void {
    const map = new Map<number, any>();
    for (const a of this.quizHistory) {
      if (!map.has(a.quizId)) {
        map.set(a.quizId, {
          quizId: a.quizId,
          quizTitle: a.quizTitle,
          totalAttempts: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          attempts: []
        });
      }
      const s = map.get(a.quizId)!;
      s.totalAttempts++;
      s.totalCorrect += a.correctAnswers;
      s.totalQuestions += a.totalQuestions;
      s.attempts.push(a);
    }
    map.forEach(s => s.overallPercentage = (s.totalCorrect / s.totalQuestions) * 100);
    this.quizSummaries = Array.from(map.values()).sort((a, b) => b.quizId - a.quizId);
  }

  toggleQuiz(quizId: number): void {
    this.expandedQuizId = this.expandedQuizId === quizId ? null : quizId;
  }

  toggleQuizSelection(quizId: number): void {
    if (this.selectedQuizIds.has(quizId)) {
      this.selectedQuizIds.delete(quizId);
    } else {
      this.selectedQuizIds.add(quizId);
    }
    this.updateChart();
  }

  getQuizColor(quizId: number): string {
    return this.colorPalette[this.quizSummaries.findIndex(s => s.quizId === quizId) % this.colorPalette.length];
  }

  updateChart(): void {
    if (!this.chartCanvas) return;

    const selected = this.quizSummaries.filter(s => this.selectedQuizIds.has(s.quizId));
    const datasets = selected.map(s => ({
      label: s.quizTitle,
      data: [...s.attempts].reverse().map((a: any, i: number) => ({ x: i + 1, y: a.correctAnswers })),
      borderColor: this.getQuizColor(s.quizId),
      backgroundColor: this.getQuizColor(s.quizId),
      tension: 0.3,
      pointRadius: 5,
      pointHoverRadius: 7,
      fill: false
    }));

    const config: ChartConfiguration = {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `${(ctx.raw as any).y} poprawnych`
            }
          }
        },
        scales: {
          x: { type: 'linear', title: { display: true, text: 'Numer podejścia' }, ticks: { stepSize: 1 } },
          y: { title: { display: true, text: 'Poprawne odpowiedzi' }, beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    };

    if (this.chart) this.chart.destroy();
    this.chart = new Chart(this.chartCanvas.nativeElement, config);
  }

  createDonutChart(): void {
    if (!this.donutCanvas || !this.scienceSummary.length) return;

    const labels = this.scienceSummary.map(s => s.scienceName);
    const data = this.scienceSummary.map(s => s.totalQuizzesTaken);
    const colors = this.scienceSummary.map((_, idx) => this.colorPalette[idx % this.colorPalette.length]);

      const config: ChartConfiguration<'doughnut'> = {
          type: 'doughnut',
          data: {
              labels,
              datasets: [{
                  data,
                  backgroundColor: colors,
                  borderWidth: 1
              }]
          },
          options: {
              responsive: false,
              cutout: '70%',
              plugins: {
                  legend: { display: false }
              }
          }
      };

    if (this.donutChart) this.donutChart.destroy();
    this.donutChart = new Chart(this.donutCanvas.nativeElement, config);
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  formatPercentage(value: number): string {
    return value.toFixed(2);
  }
}
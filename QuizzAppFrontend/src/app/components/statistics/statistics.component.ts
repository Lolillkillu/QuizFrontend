import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
    username: string = '';
    gameHistory: any[] = [];
    totalGames: number = 0;

    constructor(
        private quizService: QuizService,
        private authState: AuthStateService
    ) { }

    ngOnInit(): void {
        this.username = this.authState.getUsername();
        this.loadUserStatistics();
    }

    loadUserStatistics(): void {
        //trestowa implemaentacja
        this.gameHistory = [
            {
                quizTitle: "Quiz",
                dateCompleted: new Date(),
                correctAnswers: 8,
                totalQuestions: 10,
                scorePercentage: 80.0
            },
            {
                quizTitle: "jakiś tytuł",
                dateCompleted: new Date('2023-05-15'),
                correctAnswers: 7,
                totalQuestions: 10,
                scorePercentage: 70.0
            }
        ];
        this.totalGames = this.gameHistory.length;
    }

    formatDate(date: Date | string): string {
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }

    formatPercentage(value: number): string {
        return value.toFixed(2);
    }
}
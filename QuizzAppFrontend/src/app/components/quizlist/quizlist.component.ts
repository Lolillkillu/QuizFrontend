import { Component, OnInit } from '@angular/core';
import { QuizService } from '../../services/quiz.service';
import { Quiz } from '../../models/quiz.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quizlist',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './quizlist.component.html',
  styleUrls: ['./quizlist.component.css'],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ]
})
export class QuizListComponent implements OnInit {
  quizzes: Quiz[] = [];
  searchTerm: string = '';
  sortBy: string | null = null;
  tempSortBy: string | null = null;
  isSortPanelVisible: boolean = false;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private quizService: QuizService,
    private router: Router
  ) {}

  get filteredQuizzes(): Quiz[] {
    let filtered = this.quizzes.filter(quiz => 
      quiz.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (quiz.description?.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
      quiz.author.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    if (this.sortBy) {
      switch(this.sortBy) {
        case 'title-asc':
          filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'title-desc':
          filtered = filtered.sort((a, b) => b.title.localeCompare(a.title));
          break;
        case 'id-desc':
          filtered = filtered.sort((a, b) => b.quizzId - a.quizzId);
          break;
        case 'id-asc':
          filtered = filtered.sort((a, b) => a.quizzId - b.quizzId);
          break;
      }
    }
    
    return filtered;
  }

  toggleSortPanel(): void {
    this.isSortPanelVisible = !this.isSortPanelVisible;
    this.tempSortBy = this.sortBy;
  }

  applySort(): void {
    this.sortBy = this.tempSortBy;
    this.isSortPanelVisible = false;
  }

  resetSort(): void {
    this.sortBy = null;
    this.tempSortBy = null;
    this.isSortPanelVisible = false;
  }

  ngOnInit() {
    this.quizService.getQuizzes()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (data: Quiz[]) => this.quizzes = data,
        error: (err: any) => console.error('Error:', err)
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  navigateToGame(quizId: number): void {
    this.router.navigate(['/quiz', quizId, 'play']);
  }
}
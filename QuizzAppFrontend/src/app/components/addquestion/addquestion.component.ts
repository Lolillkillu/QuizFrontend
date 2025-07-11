import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { QuestionSearchResult } from '../../models/quiz.model';

@Component({
  selector: 'app-addquestion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule
  ],
  templateUrl: './addquestion.component.html',
  styleUrls: ['./addquestion.component.css']
})
export class AddQuestionComponent implements OnInit, OnDestroy {
  questionForm: FormGroup;
  searchControl = new FormControl('');
  searchResults: QuestionSearchResult[] = [];
  groupedResults: { [key: string]: QuestionSearchResult[] } = {};
  private searchTerms = new Subject<string>();
  private destroy$ = new Subject<void>();
  isLoading = false;
  searchError = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {
    this.questionForm = this.fb.group({
      questionText: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (term.length < 3) {
          this.searchResults = [];
          this.groupedResults = {};
          this.searchError = false;
          return of([]);
        }
        
        this.isLoading = true;
        this.searchError = false;
        return this.quizService.searchQuestions(term).pipe(
          catchError(() => {
            this.searchError = true;
            return of([]);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.groupResults();
        this.isLoading = false;
      },
      error: () => {
        this.searchResults = [];
        this.groupedResults = {};
        this.isLoading = false;
        this.searchError = true;
      }
    });

    this.searchControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerms.next(term || '');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private groupResults(): void {
    this.groupedResults = {};
    this.searchResults.forEach(result => {
      const key = result.quizzTitle || 'Brak quizu';
      if (!this.groupedResults[key]) {
        this.groupedResults[key] = [];
      }
      this.groupedResults[key].push(result);
    });
  }

  get quizTitles(): string[] {
    return Object.keys(this.groupedResults).sort((a, b) => a.localeCompare(b));
  }

  get quizId(): number {
    const id = this.route.snapshot.paramMap.get('quizId');
    return id ? Number(id) : 0;
  }

  onSubmit() {
    if (this.questionForm.valid) {
      this.quizService.addQuestionToQuiz(
        this.quizId,
        this.questionForm.get('questionText')?.value || ''
      ).subscribe({
        next: () => this.router.navigate(['/quizzes']),
        error: (error) => console.error('Error:', error)
      });
    }
  }
}
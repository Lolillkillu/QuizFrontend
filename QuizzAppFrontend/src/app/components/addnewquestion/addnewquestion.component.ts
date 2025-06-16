import { Component } from '@angular/core';
import { QuizService } from '../../services/quiz.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-addnewquestion',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule ],
  templateUrl: './addnewquestion.component.html',
  styleUrls: ['./addnewquestion.component.css']
})
export class AddnewquestionComponent {
  questionText: string = '';
  quizId!: number;

  constructor(
    private quizService: QuizService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.params.subscribe(params => {
      this.quizId = +params['quizId'];
    });
  }

  onSubmit() {
    this.quizService.addQuestionToQuiz(this.quizId, this.questionText).subscribe({
      next: () => {
        this.router.navigate(['/quizzes', this.quizId]);
      },
      error: (err) => {
        console.error('Błąd podczas dodawania pytania:', err);
      }
    });
  }
}
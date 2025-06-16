import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { Answer } from '../../models/answer.model';

@Component({
  selector: 'app-add-new-answer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './addnewanswer.component.html',
  styleUrls: ['./addnewanswer.component.css']
})
export class AddNewAnswerComponent implements OnInit {
  answerText = '';
  isCorrect = false;
  quizId!: number;
  questionId!: number;

  constructor(
    private route: ActivatedRoute,
    private quizService: QuizService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.quizId = +params['quizId'];
      this.questionId = +params['questionId'];
    });
  }

  onSubmit() {
    const newAnswer: Partial<Answer> = {
      answer: this.answerText,
      isCorrect: this.isCorrect
    };

    this.quizService.addAnswersToQuestion(this.questionId, [newAnswer]).subscribe({
      next: () => {
        this.router.navigate(['/quizzes', this.quizId]);
      },
      error: (err) => {
        console.error('Bład podczas dodawania odpowiedzi:', err);
      }
    });
  }
}
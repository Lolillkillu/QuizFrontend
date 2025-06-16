import { Component, OnInit } from '@angular/core';
import { QuizService } from '../../services/quiz.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

interface AnswerDto {
  $id: string;
  answerId: number;
  answerText: string;
  isCorrect: boolean;
}

interface QuestionWithAnswers {
  $id: string;
  questionId: number;
  questionText: string;
  answers: {
    $id: string;
    $values: AnswerDto[];
  };
}

@Component({
  selector: 'app-quiz-game',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './quizgame.component.html',
  styleUrls: ['./quizgame.component.css']
})
export class QuizGameComponent implements OnInit {
  questions: QuestionWithAnswers[] = [];
  currentQuestionIndex: number = 0;
  selectedAnswer: AnswerDto | null = null;
  isAnswerSelected = false;
  quizId!: number;
  quizFinished = false;
  questionStatuses: Array<'unanswered' | 'correct' | 'incorrect'> = [];
  currentScore: number = 0
  showModeSelection = true;

  constructor(
    private quizService: QuizService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.quizId = Number(this.route.snapshot.paramMap.get('quizId'));
  }

  startSoloGame() {
    this.showModeSelection = false;
    this.loadQuestions();
  }

  startMultiplayer() {
    this.router.navigate(['/multiplayer'], {
      queryParams: { quizId: this.quizId }
    });
  }

  restartQuiz() {
    this.showModeSelection = true;
    this.quizFinished = false;
    this.currentScore = 0;
    this.currentQuestionIndex = 0;
    this.questions = [];
    this.questionStatuses = [];
  }

loadQuestions() {
  this.quizService.getRandomQuestions(this.quizId).subscribe({
    next: (response: any) => {
      this.questions = response.$values.map((q: any) => this.mapQuestion(q));
      this.questionStatuses = new Array(this.questions.length).fill('unanswered');
      this.resetState();
    },
    error: (err) => console.error('Error:', err)
  });
}

  private mapQuestion(question: any): QuestionWithAnswers {
    return {
      $id: question.$id,
      questionId: question.questionId,
      questionText: question.questionText,
      answers: {
        $id: question.answers.$id,
        $values: question.answers.$values.map((a: any) => ({
          $id: a.$id,
          answerId: a.answerId,
          answerText: a.answerText,
          isCorrect: a.isCorrect
        }))
      }
    };
  }

  selectAnswer(answer: AnswerDto) {
  if (!this.isAnswerSelected) {
    this.selectedAnswer = answer;
    this.isAnswerSelected = true;

    const newStatus = answer.isCorrect ? 'correct' : 'incorrect';
    this.questionStatuses[this.currentQuestionIndex] = newStatus;

    if (newStatus === 'correct') this.currentScore++;
  }
}

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.resetState();
    } else {
      this.quizFinished = true;
    }
  }

  resetState() {
    this.selectedAnswer = null;
    this.isAnswerSelected = false;
  }

  get answerStatusClass() {
    if (!this.selectedAnswer) return '';
    return this.selectedAnswer.isCorrect ? 'correct' : 'incorrect';
  }

  getResultClass(): string {
  const percentage = (this.currentScore / this.questions.length) * 100;
  if (percentage >= 80) return 'good';
  if (percentage >= 50) return 'average';
  return 'poor';
}

getResultText(): string {
  const percentage = (this.currentScore / this.questions.length) * 100;
  if (percentage >= 90) return 'Gratulację';
  if (percentage >= 70) return 'Nawet dobrze';
  if (percentage >= 50) return 'Może być...';
  return 'Tak średnio';
}
}
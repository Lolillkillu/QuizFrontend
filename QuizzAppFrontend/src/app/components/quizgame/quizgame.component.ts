import { Component, OnInit, OnDestroy } from '@angular/core';
import { QuizService } from '../../services/quiz.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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

interface PlayerAnswer {
  questionText: string;
  playerAnswerText: string;
  isCorrect: boolean;
  correctAnswerText: string;
}

@Component({
  selector: 'app-quiz-game',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './quizgame.component.html',
  styleUrls: ['./quizgame.component.css']
})
export class QuizGameComponent implements OnInit, OnDestroy {
  questions: QuestionWithAnswers[] = [];
  currentQuestionIndex: number = 0;
  selectedAnswer: AnswerDto | null = null;
  isAnswerSelected = false;
  quizId!: number;
  quizFinished = false;
  questionStatuses: Array<'unanswered' | 'correct' | 'incorrect'> = [];
  currentScore: number = 0;
  showModeSelection = true;
  showTimeLimitSetting = false;
  isTimeLimitEnabled = false;
  timeLimit = 30;
  timeLeft = this.timeLimit;
  timer: any;
  timerEndTime: number = 0;
  playerAnswers: PlayerAnswer[] = [];
  showAnswersSummary = false;

  constructor(
    private quizService: QuizService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.quizId = Number(this.route.snapshot.paramMap.get('quizId'));
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  onSoloGameClick() {
    this.showModeSelection = false;
    this.showTimeLimitSetting = true;
  }

  startSoloGame() {
    this.showTimeLimitSetting = false;
    this.timeLeft = this.timeLimit;
    this.loadQuestions();
  }

  startMultiplayer() {
    this.router.navigate(['/multiplayer'], {
      queryParams: { quizId: this.quizId }
    });
  }

  restartQuiz() {
    this.showModeSelection = true;
    this.showTimeLimitSetting = false;
    this.quizFinished = false;
    this.currentScore = 0;
    this.currentQuestionIndex = 0;
    this.questions = [];
    this.questionStatuses = [];
    this.isTimeLimitEnabled = false;
    this.timeLimit = 30;
    this.playerAnswers = [];
    this.showAnswersSummary = false;
    this.stopTimer();
  }

  loadQuestions() {
    this.quizService.getRandomQuestions(this.quizId).subscribe({
      next: (response: any) => {
        this.questions = response.$values.map((q: any) => this.mapQuestion(q));
        this.questionStatuses = new Array(this.questions.length).fill('unanswered');
        this.resetState();
        
        if (this.isTimeLimitEnabled) {
          this.startTimer();
        }
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
      this.stopTimer();
      this.selectedAnswer = answer;
      this.isAnswerSelected = true;

      const newStatus = answer.isCorrect ? 'correct' : 'incorrect';
      this.questionStatuses[this.currentQuestionIndex] = newStatus;

      if (newStatus === 'correct') this.currentScore++;

      this.recordPlayerAnswer(answer.answerText, answer.isCorrect);
    }
  }

  nextQuestion() {
    this.stopTimer();
    
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.resetState();
      
      if (this.isTimeLimitEnabled) {
        this.startTimer();
      }
    } else {
      this.quizFinished = true;
    }
  }

  resetState() {
    this.selectedAnswer = null;
    this.isAnswerSelected = false;
    this.timeLeft = this.timeLimit;
  }

  startTimer() {
    this.timerEndTime = Date.now() + this.timeLimit * 1000;
    
    this.timer = setInterval(() => {
      const timeRemaining = Math.max(0, Math.floor((this.timerEndTime - Date.now()) / 1000));
      
      if (timeRemaining !== this.timeLeft) {
        this.timeLeft = timeRemaining;
      }
      
      if (this.timeLeft <= 0) {
        this.stopTimer();
        this.handleTimeExpired();
      }
    }, 50);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  handleTimeExpired() {
    if (!this.isAnswerSelected) {
      this.recordPlayerAnswer('Brak odpowiedzi', false);
      
      this.questionStatuses[this.currentQuestionIndex] = 'incorrect';
      this.isAnswerSelected = true;
    }
  }

  private recordPlayerAnswer(answerText: string, isCorrect: boolean) {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    const correctAnswer = currentQuestion.answers.$values.find(a => a.isCorrect);
    
    this.playerAnswers.push({
      questionText: currentQuestion.questionText,
      playerAnswerText: answerText,
      isCorrect: isCorrect,
      correctAnswerText: correctAnswer ? correctAnswer.answerText : 'Brak poprawnej odpowiedzi'
    });
  }

  getWarningThreshold(): number {
    return Math.max(5, this.timeLimit / 3);
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

  formatTime(seconds: number): string {
    return `${seconds}s`;
  }
}
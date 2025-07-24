import { Component, OnInit, OnDestroy } from '@angular/core';
import { QuizService } from '../../services/quiz.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthStateService } from '../../services/auth-state.service';

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
  isMultiChoiceEnabled = false;
  numberOfTiles = 10;
  answersPerQuestion = 4;
  selectedAnswers: AnswerDto[] = [];
  isAnswerSubmitted = false;
  username: string = '';

  constructor(
    private quizService: QuizService,
    private route: ActivatedRoute,
    private router: Router,
    private authStateService: AuthStateService
  ) {}

  ngOnInit() {
    this.quizId = Number(this.route.snapshot.paramMap.get('quizId'));
    this.username = this.authStateService.getUsername();
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
    this.isMultiChoiceEnabled = false;
    this.numberOfTiles = 10;
    this.answersPerQuestion = 4;
    this.selectedAnswers = [];
    this.isAnswerSubmitted = false;
    this.stopTimer();
  }

  loadQuestions() {
  if (this.isMultiChoiceEnabled) {
    this.quizService.getRandomMultiQuestions(
      this.quizId,
      this.numberOfTiles,
      this.answersPerQuestion
    ).subscribe({
      next: (response: any) => {
        this.questions = response.$values.map((q: any) => this.mapQuestion(q));
        this.questionStatuses = new Array(this.questions.length).fill('unanswered');
        this.resetState();
        if (this.isTimeLimitEnabled) this.startTimer();
      },
      error: (err) => console.error('Error:', err)
    });
  } else {
    this.quizService.getRandomQuestions(this.quizId, this.numberOfTiles).subscribe({
      next: (response: any) => {
        this.questions = response.$values.map((q: any) => this.mapQuestion(q));
        this.questionStatuses = new Array(this.questions.length).fill('unanswered');
        this.resetState();
        if (this.isTimeLimitEnabled) this.startTimer();
      },
      error: (err) => console.error('Error:', err)
    });
  }
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

  toggleAnswer(answer: AnswerDto) {
    if (!this.isAnswerSelected && !this.isAnswerSubmitted) {
      const index = this.selectedAnswers.findIndex(a => a.answerId === answer.answerId);
      if (index !== -1) {
        this.selectedAnswers.splice(index, 1);
      } else {
        this.selectedAnswers.push(answer);
      }
    }
  }

  isSelected(answer: AnswerDto): boolean {
    return this.selectedAnswers.some(a => a.answerId === answer.answerId);
  }

  submitMultiChoiceAnswers() {
    if (this.isAnswerSubmitted || this.isAnswerSelected) {
      return;
    }

    this.stopTimer();
    this.isAnswerSelected = true;
    this.isAnswerSubmitted = true;

    const currentQuestion = this.questions[this.currentQuestionIndex];
    const correctAnswers = currentQuestion.answers.$values.filter(a => a.isCorrect);
    
    const allCorrectSelected = correctAnswers.every(ca => 
      this.selectedAnswers.some(sa => sa.answerId === ca.answerId)
    );
    
    const noIncorrectSelected = this.selectedAnswers.every(sa => 
      correctAnswers.some(ca => ca.answerId === sa.answerId)
    );

    const isCorrect = allCorrectSelected && noIncorrectSelected;

    if (isCorrect) {
      this.questionStatuses[this.currentQuestionIndex] = 'correct';
      this.currentScore++;
    } else {
      this.questionStatuses[this.currentQuestionIndex] = 'incorrect';
    }

    if (!this.playerAnswers.some(pa => pa.questionText === currentQuestion.questionText)) {
      this.recordPlayerAnswerForMultiChoice();
    }
  }

  private recordPlayerAnswerForMultiChoice() {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    const correctAnswers = currentQuestion.answers.$values
      .filter(a => a.isCorrect)
      .map(a => a.answerText);

    const playerAnswerText = this.selectedAnswers.map(a => a.answerText).join(', ');
    const correctAnswerText = correctAnswers.join(', ');

    this.playerAnswers.push({
      questionText: currentQuestion.questionText,
      playerAnswerText,
      isCorrect: this.questionStatuses[this.currentQuestionIndex] === 'correct',
      correctAnswerText
    });
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
    this.selectedAnswers = [];
    this.isAnswerSelected = false;
    this.isAnswerSubmitted = false;
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
      if (this.isMultiChoiceEnabled && this.selectedAnswers.length > 0) {
        this.submitMultiChoiceAnswers();
      } else {
        this.recordPlayerAnswer('Brak odpowiedzi', false);
        this.questionStatuses[this.currentQuestionIndex] = 'incorrect';
        this.isAnswerSelected = true;
      }
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
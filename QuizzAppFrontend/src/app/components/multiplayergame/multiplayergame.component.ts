import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameMode, SignalrService } from '../../services/signalr.service';
import { QuizService } from '../../services/quiz.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-multiplayer-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './multiplayergame.component.html',
  styleUrls: ['./multiplayergame.component.css']
})
export class MultiplayerGameComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  gameId: string | null = null;
  players: any[] = [];
  currentQuestion: any = null;
  gameStatus: 'waiting' | 'in-progress' | 'completed' = 'waiting';
  quizId: number | null = null;
  playerName = '';
  connectionStatus = 'disconnected';
  selectedAnswer: any = null;
  isAnswerSelected = false;
  currentScore = 0;
  playerId: string | null = null;
  isSubmitting = false;
  isJoining = false;
  errorMessage = '';
  gameLink = '';
  isHost = false;
  viewState: 'init' | 'gameCreated' | 'nameInput' | 'inGame' = 'init';
  isPlayerReady = false;
  playerCompleted = false;
  currentQuestionIndex = -1;
  questionStatuses: Array<'unanswered' | 'correct' | 'incorrect'> = [];
  allPlayersReady = false;
  playerStatus: 'playing' | 'completed' = 'playing';
  expandedPlayers: { [playerId: string]: boolean } = {};
  isTimeLimitEnabled = false;
  timeLimit = 30;
  timeLeft = this.timeLimit;
  timer: any;
  timerEndTime: number = 0;
  showTimeSettings = false;
  isMultiChoiceEnabled = false;
  numberOfTiles = 10;
  answersPerQuestion = 4;
  selectedAnswers: any[] = [];
  isAnswerSubmitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private signalrService: SignalrService,
    private quizService: QuizService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.gameId = params['gameId'] || null;
      this.updateViewState();
    });

    this.route.queryParams.subscribe(params => {
      this.quizId = Number(params['quizId']);
      this.isHost = params['host'] === 'true';
      this.updateViewState();
    });

    const connectionTimeout = setTimeout(() => {
      if (this.connectionStatus === 'disconnected') {
        this.errorMessage = 'Bład połączenia z serwerem. Odśwież stronę.';
      }
    }, 10000);

    this.subscriptions.push(
      this.signalrService.connectionStatus$.subscribe(status => {
        if (status === 'connected') {
          clearTimeout(connectionTimeout);
        }
        this.connectionStatus = status;
      })
    );

    this.setupSignalrSubscriptions();
  }

  private updateViewState() {
    if (this.gameId) {
      this.gameLink = `${window.location.origin}/multiplayer/${this.gameId}`;
      if (this.isHost) {
        this.viewState = 'gameCreated';
      } else {
        this.viewState = 'nameInput';
      }
    } else {
      this.viewState = 'init';
    }
  }

  createGame() {
    if (!this.quizId) {
      this.errorMessage = 'Brak identyfikatora quizu.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.signalrService.createGame(this.quizId)
      .then(gameId => {
        this.gameId = gameId;
        this.gameLink = `${window.location.origin}/multiplayer/${gameId}`;
        this.isSubmitting = false;
        this.router.navigate(['/multiplayer', gameId], {
          queryParams: { quizId: this.quizId, host: true },
          queryParamsHandling: 'merge'
        });
      })
      .catch(err => {
        this.isSubmitting = false;
        this.errorMessage = 'Nie udało się utworzyć gry: ' + (err.error || 'Serwer nie odpowiada');
        console.error('Błąd podczas tworzenia gry:', err);
      });
  }

  joinGame(playerName: string) {
    this.isJoining = true;
    this.errorMessage = '';

    if (!playerName.trim()) {
      this.errorMessage = 'Nazwa uzytkownika nie może być pusta';
      this.isJoining = false;
      return;
    }

    if (!this.gameId) {
      this.errorMessage = 'Brak identyfikatora gry';
      this.isJoining = false;
      return;
    }

    this.playerName = playerName;

    this.signalrService.joinGame(this.gameId, playerName, this.isHost)
      .then(playerId => {
        this.playerId = playerId;
        this.isJoining = false;
        this.viewState = 'inGame';
      })
      .catch(err => {
        this.isJoining = false;
        this.errorMessage = 'Nie udało się dołączyć do gry: ' + (err.error || 'Serwer nie odpowiada');
        console.error('Błąd w trakcie dołączania do gry:', err);
      });
  }

  private setupSignalrSubscriptions() {
    this.subscriptions.push(
      this.signalrService.playerCompleted$.subscribe((playerId: string) => {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
          player.completed = true;
        }
        
        if (playerId === this.playerId) {
          this.playerCompleted = true;
          this.playerStatus = 'completed';
        }
      })
    );

    this.subscriptions.push(
      this.signalrService.playerJoined$.subscribe(players => {
        this.players = players;
        this.checkAllPlayersReady();
      })
    );

    this.subscriptions.push(
      this.signalrService.nextQuestion$.subscribe(question => {
        this.currentQuestion = question;
        this.gameStatus = 'in-progress';
        this.resetState();
        this.isPlayerReady = false;
        this.playerStatus = 'playing';
        
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex === 0) {
          this.questionStatuses = Array(10).fill('unanswered');
        }

        this.isTimeLimitEnabled = question.isTimeLimitEnabled;
        this.timeLimit = question.timeLimitPerQuestion || 30;
        this.isMultiChoiceEnabled = question.isMultiChoice;

        if (this.isTimeLimitEnabled && this.playerStatus === 'playing') {
          this.startTimer();
        }
      })
    );

    this.subscriptions.push(
      this.signalrService.answerProcessed$.subscribe(result => {
        if (result.playerId === this.playerId) {
          const status = result.isCorrect ? 'correct' : 'incorrect';
          this.questionStatuses[this.currentQuestionIndex] = status;
          
          if (result.isCorrect) {
            this.currentScore++;
          }
        }
      })
    );

    this.subscriptions.push(
      this.signalrService.gameCompleted$.subscribe(results => {
        this.gameStatus = 'completed';
        this.playerCompleted = true;
        this.playerStatus = 'completed';
        this.players = results
          .map((r: any) => ({
            id: r.playerId,
            name: r.playerName || 'Anonim',
            score: r.score,
            answers: r.answers || []
          }))
          .sort((a, b) => b.score - a.score);
      })
    );

    this.subscriptions.push(
      this.signalrService.gameError$.subscribe(error => {
        this.errorMessage = error;
      })
    );

    this.subscriptions.push(
      this.signalrService.playerReady$.subscribe((playerId) => {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
          player.isReady = true;
        }
        this.checkAllPlayersReady();
      })
    );

    this.subscriptions.push(
      this.signalrService.gameModeUpdated$.subscribe((mode: GameMode) => {
        this.isMultiChoiceEnabled = (mode === GameMode.MultipleChoice);
      })
    );
  }

  private checkAllPlayersReady() {
    if (this.players.length >= 2) {
      this.allPlayersReady = this.players.filter(p => p.isReady).length >= 2;
    }
  }

markPlayerReady() {
  if (!this.gameId) return;

  if (this.isHost) {
    this.signalrService.setGameMode(this.gameId!, 
      this.isMultiChoiceEnabled ? GameMode.MultipleChoice : GameMode.SingleChoice)
      .then(() => {
        return this.signalrService.setTimeSettings(this.gameId!, this.isTimeLimitEnabled, this.timeLimit);
      })
      .then(() => {
        this.isPlayerReady = true;
        if (this.gameId) {
          this.signalrService.sendPlayerReady(this.gameId);
        }
      })
      .catch(err => {
        this.errorMessage = 'Błąd limitu czasu';
        console.error(err);
      });
  } else {
    this.isPlayerReady = true;
    if (this.gameId) {
      this.signalrService.sendPlayerReady(this.gameId);
    }
  }
}

  getConnectionStatusText(): string {
    switch (this.connectionStatus) {
      case 'connected': return 'Połączono';
      case 'connecting': return 'Łączenie...';
      case 'disconnected': return 'Rozłączono';
      default: return this.connectionStatus;
    }
  }

  selectAnswer(answer: any) {
    if (!this.isAnswerSelected && this.gameId && this.currentQuestion) {
      this.stopTimer();
      this.selectedAnswer = answer;
      this.isAnswerSelected = true;
      this.signalrService.submitAnswer(
        this.gameId,
        this.currentQuestion.questionId,
        answer.answerId
      );
    }
  }

  toggleAnswer(answer: any) {
    if (!this.isAnswerSelected && !this.isAnswerSubmitted) {
      const index = this.selectedAnswers.findIndex(a => a.answerId === answer.answerId);
      if (index !== -1) {
        this.selectedAnswers.splice(index, 1);
      } else {
        this.selectedAnswers.push(answer);
      }
    }
  }

  isSelected(answer: any): boolean {
    return this.selectedAnswers.some(a => a.answerId === answer.answerId);
  }

  submitMultiChoiceAnswers() {
    if (this.isAnswerSubmitted || this.isAnswerSelected) {
      return;
    }

    this.stopTimer();
    this.isAnswerSelected = true;
    this.isAnswerSubmitted = true;
    
    const answerIds = this.selectedAnswers.map(a => a.answerId);
    this.signalrService.submitMultiAnswer(
      this.gameId!,
      this.currentQuestion.questionId,
      answerIds
    );
  }

  submitNoAnswer() {
    if (!this.isAnswerSelected && this.gameId && this.currentQuestion) {
      this.stopTimer();
      this.isAnswerSelected = true;
      this.signalrService.submitAnswer(
        this.gameId,
        this.currentQuestion.questionId,
        null
      );
    }
  }

  restartGame() {
    if (this.quizId) {
      this.router.navigate(['/quiz-game', this.quizId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  copyGameLink() {
    if (!this.gameLink && this.gameId) {
      this.gameLink = `${window.location.origin}/multiplayer/${this.gameId}`;
    }

    navigator.clipboard.writeText(this.gameLink)
      .then(() => alert('Link skopiowany do schowka!'))
      .catch(err => {
        this.errorMessage = 'Błąd podczas kopiowania linku';
        console.error('Błąd odczas kopiowania:', err);
      });
  }

  togglePlayerAnswers(playerId: string): void {
    this.expandedPlayers[playerId] = !this.expandedPlayers[playerId];
  }

  startTimer() {
    this.stopTimer();
    this.timeLeft = this.timeLimit;
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
    this.submitNoAnswer();
  }

  toggleTimeSettings() {
    this.showTimeSettings = !this.showTimeSettings;
  }

  getWarningThreshold(): number {
    return Math.max(5, this.timeLimit / 3);
  }

  formatTime(seconds: number): string {
    return `${seconds}s`;
  }

  resetState() {
    this.selectedAnswer = null;
    this.selectedAnswers = [];
    this.isAnswerSelected = false;
    this.isAnswerSubmitted = false;
    this.timeLeft = this.timeLimit;
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
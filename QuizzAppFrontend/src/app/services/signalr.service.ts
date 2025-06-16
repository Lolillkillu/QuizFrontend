import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private hubConnection: signalR.HubConnection;
  
  public connectionStatus$ = new BehaviorSubject<string>('disconnected');
  public gameCreated$ = new Subject<string>();
  public playerJoined$ = new Subject<any[]>();
  public nextQuestion$ = new Subject<any>();
  public answerProcessed$ = new Subject<{playerId: string, isCorrect: boolean}>();
  public gameCompleted$ = new Subject<any[]>();
  public gameError$ = new Subject<string>();
  public quizIdSet$ = new Subject<void>();
  public playerReady$ = new Subject<string>();
  public playerCompleted$ = new Subject<string>();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7039/gamehub')
      .configureLogging(signalR.LogLevel.Debug)
      .build();

    this.startConnection();
    this.registerHandlers();
  }

  private startConnection(): void {
    this.hubConnection.start()
      .then(() => {
        console.log('Połączono z hubem');
        this.connectionStatus$.next('connected');
      })
      .catch(err => {
        console.error('Błąd połączenia: ', err);
        this.connectionStatus$.next('disconnected');
        setTimeout(() => this.startConnection(), 5000);
      });

    this.hubConnection.onclose(() => {
      this.connectionStatus$.next('disconnected');
      setTimeout(() => this.startConnection(), 5000);
    });
  }

  private registerHandlers(): void {
    this.hubConnection.on('GameCreated', (gameId: string) => {
      this.gameCreated$.next(gameId);
    });

    this.hubConnection.on('PlayerJoined', (players: any[]) => {
      this.playerJoined$.next(players);
    });

    this.hubConnection.on('NextQuestion', (question: any) => {
      this.nextQuestion$.next(question);
    });

    this.hubConnection.on('AnswerProcessed', (playerId: string, isCorrect: boolean) => {
      this.answerProcessed$.next({ playerId, isCorrect });
    });

    this.hubConnection.on('GameCompleted', (results: any) => {
      this.gameCompleted$.next(results);
    });

    this.hubConnection.on('GameError', (error: string) => {
      this.gameError$.next(error);
    });

    this.hubConnection.on('GameCreated', (gameId: string, quizId: number) => {
      this.gameCreated$.next(gameId);
    });

    this.hubConnection.on('PlayerCompleted', (playerId: string) => {
      this.playerCompleted$.next(playerId);
    });

    this.hubConnection.on('PlayerReady', (playerId: string) => {
        this.playerReady$.next(playerId);
    });
  }

  public createGame(quizId: number): Promise<string> {
    return this.hubConnection.invoke('CreateGame', quizId);
  }

  public setQuizIdForGame(gameId: string, quizId: number): void {
    this.hubConnection.send('SetQuizIdForGame', gameId, quizId);
  }

  public joinGame(gameId: string, playerName: string, isHost: boolean): Promise<string> {
    return this.hubConnection.invoke('JoinGame', gameId, playerName, isHost);
  }

  public submitAnswer(gameId: string, questionId: number, answerId: number): void {
    this.hubConnection.send('SubmitAnswer', gameId, questionId, answerId);
  }

  public startGame(gameId: string): void {
    this.hubConnection.send('StartGame', gameId);
  }

  public sendPlayerReady(gameId: string): Promise<void> {
    return this.hubConnection.invoke('PlayerReady', gameId);
  }
}
import { Answer } from './answer.model';

export interface Question {
  questionId: number;
  quizId: number;
  question: string;
  answers: Answer[];
}
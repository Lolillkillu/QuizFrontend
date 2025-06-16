import { Question } from './question.model';

export interface Quiz {
  quizzId: number;
  title: string;
  description?: string;
  scienceId?: number;
  author: string;
  questions: Question[];
}

export interface QuestionWithAnswers {
  $id: string;
  questionId: number;
  questionText: string;
  answers: {
    $id: string;
    $values: AnswerDto[];
  };
}

export interface AnswerDto {
  $id: string;
  answerId: number;
  answerText: string;
  isCorrect: boolean;
}
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuizListComponent } from './components/quizlist/quizlist.component';
import { CreateQuizFormComponent } from './components/createquiz/createquiz-form.component';
import { AddQuestionComponent } from './components/addquestion/addquestion.component';
import { DeleteQuizComponent } from './components/deletequiz/deletequiz.component';
import { QuizDetailComponent } from './components/quizdetail/quizdetail.component';
import { EditQuestionComponent } from './components/editquestion/editquestion.component';
import { EditAnswerComponent } from './components/editanswer/editanswer.component';
import { AddNewAnswerComponent } from './components/addnewanswer/addnewanswer.component';
import { AddnewquestionComponent } from './components/addnewquestion/addnewquestion.component';
import { QuizGameComponent } from './components/quizgame/quizgame.component';
import { MultiplayerGameComponent } from './components/multiplayergame/multiplayergame.component';

const routes: Routes = [
  { path: 'quizzes', component: QuizListComponent },
  { path: 'create-quiz', component: CreateQuizFormComponent },
  { path: 'quizzes/:quizId/add-question', component: AddQuestionComponent },
  { path: 'delete-quiz', component: DeleteQuizComponent },
  { path: 'quizzes/:id', component: QuizDetailComponent },
  { path: 'quizzes/:quizId/editquestion/:questionId', component: EditQuestionComponent },
  { path: 'quizzes/:quizId/questions/:questionId/answers/:answerId/edit', component: EditAnswerComponent },
  { path: 'quizzes/:quizId/questions/:questionId/add-answer', component: AddNewAnswerComponent },
  { path: 'quizzes/:quizId/add-question', component: AddnewquestionComponent },
  { path: 'quiz-game/:quizId', component: QuizGameComponent },
  { path: 'multiplayer/:gameId', component: MultiplayerGameComponent },
  { path: 'multiplayer', component: MultiplayerGameComponent },
  { path: 'quiz-game/:quizId/multiplayer', component: MultiplayerGameComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
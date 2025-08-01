import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuizListComponent } from './components/quizlist/quizlist.component';
import { CreateQuizFormComponent } from './components/createquiz/createquiz-form.component';
import { AddQuestionComponent } from './components/addquestion/addquestion.component';
import { QuizDetailComponent } from './components/quizdetail/quizdetail.component';
import { EditQuestionComponent } from './components/editquestion/editquestion.component';
import { EditAnswerComponent } from './components/editanswer/editanswer.component';
import { AddNewAnswerComponent } from './components/addnewanswer/addnewanswer.component';
import { AddnewquestionComponent } from './components/addnewquestion/addnewquestion.component';
import { QuizGameComponent } from './components/quizgame/quizgame.component';
import { MultiplayerGameComponent } from './components/multiplayergame/multiplayergame.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { AuthGuard } from './services/auth.guard';
import { StatisticsComponent } from './components/statistics/statistics.component';

export const routes: Routes = [
  { path: 'quizzes', component: QuizListComponent },
  { path: 'create-quiz', component: CreateQuizFormComponent, canActivate: [AuthGuard] },
  { path: 'quizzes/:quizId/add-question', component: AddQuestionComponent, canActivate: [AuthGuard] },
  { path: 'quizzes/:id', component: QuizDetailComponent },
  { path: 'quizzes/:quizId/editquestion/:questionId', component: EditQuestionComponent, canActivate: [AuthGuard] },
  { path: 'quizzes/:quizId/questions/:questionId/answers/:answerId/edit', component: EditAnswerComponent, canActivate: [AuthGuard] },
  { path: 'quizzes/:quizId/questions/:questionId/add-answer', component: AddNewAnswerComponent, canActivate: [AuthGuard] },
  { path: 'quizzes/:quizId/add-question', component: AddnewquestionComponent, canActivate: [AuthGuard] },
  { path: 'quiz-game/:quizId', component: QuizGameComponent },
  { path: 'multiplayer/:gameId', component: MultiplayerGameComponent },
  { path: 'multiplayer', component: MultiplayerGameComponent },
  { path: 'quiz-game/:quizId/multiplayer', component: MultiplayerGameComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'statistics', component: StatisticsComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
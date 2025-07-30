import { Routes } from '@angular/router';
import { UploadComponent } from './components/upload/upload.component';
import { ResultComponent } from './components/result/result.component';

export const routes: Routes = [
  { path: '', component: UploadComponent },
  { path: 'results', component: ResultComponent },
  { path: '**', redirectTo: '' }
];

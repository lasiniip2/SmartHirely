import { Routes } from '@angular/router';
import { UploadComponent } from './components/upload/upload.component';
import { ResultComponent } from './components/result/result.component';
import { LandingComponent } from './components/landing/landing.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },  // Landing page as the root
  { path: 'upload', component: UploadComponent },
  { path: 'results', component: ResultComponent },
  { path: '**', redirectTo: '' }
];

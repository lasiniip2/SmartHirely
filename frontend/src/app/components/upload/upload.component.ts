import { Component } from '@angular/core';
import { ResumeService } from '../../services/resume.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.component.html',
})
export class UploadComponent {
  selectedFile: File | null = null; //Stores the file chosen by the user. Initially null.

  constructor(private resumeService: ResumeService) {} //Injects the ResumeService using Angular Dependency Injection to handle file uploads.

  //Called when a user selects a file
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    //Retrieves the first file from the file input and stores it in selectedFile
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  //Triggered when the form is submitted
  onSubmit() {
    //If no file is selected, shows an alert
    if (!this.selectedFile) {
      alert('Please select a file first.');
      return;
    }

    //If a file is selected, calls the uploadResume method from ResumeService
    //Subscribes to the Observable returned by uploadResume to handle success or error
    this.resumeService.uploadResume(this.selectedFile).subscribe({
      //Logs the result or error
      next: (res) => console.log('Upload success', res),
      error: (err) => console.error('Upload failed', err),
    });
  }
}

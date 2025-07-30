import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Add this import
import { ResumeService } from '../../services/resume.service';
import { NavigationComponent } from "../navigation/navigation.component";
import { FooterComponent } from "../footer/footer.component";

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, NavigationComponent, FooterComponent], // Add CommonModule to imports array
  templateUrl: './upload.component.html',
})
export class UploadComponent {
  selectedFile: File | null = null; //Stores the file chosen by the user. Initially null.
  isLoading = false; // Add loading state

  constructor(
    private resumeService: ResumeService,
    private router: Router
  ) {} //Injects the ResumeService using Angular Dependency Injection to handle file uploads.

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

    this.isLoading = true; // Start loading

    //If a file is selected, calls the uploadResume method from ResumeService
    //Subscribes to the Observable returned by uploadResume to handle success or error
    this.resumeService.uploadResume(this.selectedFile).subscribe({
      //Logs the result or error
      next: (res) => {
        console.log('Upload success', res);
        this.isLoading = false;
        // Navigate to results with data
        this.router.navigate(['/results'], { 
          state: { jobRoles: res.jobRoles, message: res.message } 
        });
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.isLoading = false;
        alert('Upload failed. Please try again.');
      },
    });
  }
}

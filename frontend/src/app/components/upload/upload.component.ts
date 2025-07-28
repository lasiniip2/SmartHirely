import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.component.html',
})
export class UploadComponent {
  selectedFile: File | null = null; //Stores the file chosen by the user. Initially null.

  constructor(private http: HttpClient) {} //Angular’s service for making HTTP requests. Injected using Angular’s dependency injection system.

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

    //Creates a FormData object (used for sending files)
    const formData = new FormData();
    //Appends the selected file with the key "file"
    formData.append('file', this.selectedFile);

    //Sends a POST request to your backend 
    this.http.post('http://localhost:5000/api/upload', formData).subscribe({
      //Logs the result or error
      next: (res) => console.log('Upload success', res),
      error: (err) => console.error('Upload failed', err),
    });
  }
}

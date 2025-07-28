import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.component.html',
})
export class UploadComponent {
  selectedFile: File | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit() {
    if (!this.selectedFile) {
      alert('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post('http://localhost:5000/api/upload', formData).subscribe({
      next: (res) => console.log('Upload success', res),
      error: (err) => console.error('Upload failed', err),
    });
  }
}

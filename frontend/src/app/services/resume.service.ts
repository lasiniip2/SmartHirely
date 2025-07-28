import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' }) // Automatically registers the service globally

export class ResumeService {
  constructor(private http: HttpClient) {}//Angular’s service for making HTTP requests. Injected using Angular’s dependency injection system.

  //Method to upload a resume file
  //Takes a File object as input and returns an Observable for the HTTP POST request
  uploadResume(file: File): Observable<any> {
    //Creates a FormData object to hold the file data
    //FormData is used to send files in HTTP requests
    const formData = new FormData();

    //Appends the file to the FormData object with the key 'file'
    //This key should match the server-side expectation for file uploads
    formData.append('file', file);

    //Makes an HTTP POST request to the server endpoint for file uploads
    return this.http.post('http://localhost:5000/api/upload', formData);
  }
}

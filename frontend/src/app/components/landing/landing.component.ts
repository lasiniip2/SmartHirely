import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from "../navigation/navigation.component";
import { FooterComponent } from "../footer/footer.component";

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, NavigationComponent, FooterComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {

  constructor(private router: Router) {}

  // Navigate to upload component
  navigateToUpload() {
    this.router.navigate(['/upload']);  // Navigate to the upload route
  }

  // Scroll to top section
  scrollToTop() {
    const element = document.getElementById('top-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

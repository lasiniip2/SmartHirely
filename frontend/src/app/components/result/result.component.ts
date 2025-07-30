import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface JobRole {
  jobTitle: string;
  description: string;
  careerPath: string;
  keySkills: string[];
  tools: string[];
  salaryRange: string;
  relevantCompanies: string[];
  jobPortals: string[];
}

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result.component.html',
  styleUrl: './result.component.css'
})
export class ResultComponent implements OnInit {
  jobRoles: JobRole[] = [];
  message: string = '';
  expandedCards: Set<number> = new Set();

  constructor(private router: Router) {
    // Get data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.jobRoles = navigation.extras.state['jobRoles'] || [];
      this.message = navigation.extras.state['message'] || '';
    }
  }

  ngOnInit() {
    // Redirect if no data
    if (this.jobRoles.length === 0) {
      this.router.navigate(['/']);
    }
  }

  toggleCard(index: number) {
    if (this.expandedCards.has(index)) {
      this.expandedCards.delete(index);
    } else {
      this.expandedCards.add(index);
    }
  }

  isExpanded(index: number): boolean {
    return this.expandedCards.has(index);
  }

  // goBack() {
  //   this.router.navigate(['/']);
  // }

  // downloadResults() {
  //   const dataStr = JSON.stringify(this.jobRoles, null, 2);
  //   const dataBlob = new Blob([dataStr], { type: 'application/json' });
  //   const url = URL.createObjectURL(dataBlob);
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.download = 'job-recommendations.json';
  //   link.click();
  //   URL.revokeObjectURL(url);
  // }
}
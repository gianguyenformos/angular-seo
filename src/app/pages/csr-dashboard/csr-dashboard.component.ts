import { Component, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-csr-dashboard',
  standalone: true,
  template: `
    <h1>👤 User Dashboard (CSR)</h1>
    @if (isLoading()) {
      <p>Loading your personal data...</p>
    } @else {
      <p>Welcome back! Your ID is: {{ userId() }}</p>
    }
  `
})
export class CsrDashboardComponent implements OnInit {
  userId = signal<string | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    // This runs ONLY in the browser
    setTimeout(() => {
      this.userId.set('USR-99DB');
      this.isLoading.set(false);
    }, 2000);
  }
}

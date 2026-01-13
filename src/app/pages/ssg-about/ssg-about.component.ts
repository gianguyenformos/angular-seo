import { Component } from '@angular/core';

@Component({
  selector: 'app-ssg-about',
  standalone: true,
  template: `
    <h1>🏢 Company About (SSG)</h1>
    <p>This page is static. It was generated during the build process.</p>
    <p>Version: 1.0.4 (Stable)</p>
  `
})
export class SsgAboutComponent {}

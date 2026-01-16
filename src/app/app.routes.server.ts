import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Client
  },
  {
    path: 'ssg',
    renderMode: RenderMode.Prerender // Build-time static generation
  },
  {
    path: 'ssr',
    renderMode: RenderMode.Server    // Dynamic server rendering on request
  },
  {
    path: 'csr',
    renderMode: RenderMode.Client    // Render only in the browser (Server sends empty shell)
  },
  {
    path: 'product/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      // In a real app, you would fetch this from your API
      // const ids = await fetch('https://api.example.com/products/ids').then(res => res.json());

      // For this example, we manually define 3 product IDs to prerender
      return [
        { id: '101' },
        { id: '102' },
        { id: '103' }
      ];
    }
  },
  {
    path: '**',                      // Default for all other routes
    renderMode: RenderMode.Prerender
  }
];

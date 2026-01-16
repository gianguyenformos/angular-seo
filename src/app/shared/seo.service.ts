import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);

  setTitle(title: string) {
    this.title.setTitle(title);
  }

  setMeta(description: string, keywords?: string) {
    this.meta.updateTag({ name: 'description', content: description });
    if (keywords) {
      this.meta.updateTag({ name: 'keywords', content: keywords });
    }
  }

  setCanonical(url: string) {
    this.meta.updateTag({
      rel: 'canonical',
      href: url
    } as any);
  }
}

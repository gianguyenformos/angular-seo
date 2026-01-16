import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

import { StateStorageService } from '../auth/state-storage.service';
import { ApplicationConfigService } from '../config/application-config.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly stateStorageService = inject(StateStorageService);
  private readonly applicationConfigService = inject(ApplicationConfigService);
  private readonly platformId = inject(PLATFORM_ID);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const serverApiUrl = this.applicationConfigService.getEndpointFor('');
    if (!request.url || (request.url.startsWith('http') && !(serverApiUrl && request.url.startsWith(serverApiUrl)))) {
      return next.handle(request);
    }

    // On browser: read token from storage/cookies
    // On server: withFetch() will automatically forward cookies, but we can still try to get token
    const token: string | null = this.stateStorageService.getAuthenticationToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    } else if (!isPlatformBrowser(this.platformId)) {
      // On server: withFetch() will forward cookies automatically
      // If token is not available, cookies will still be forwarded by fetch API
      // This ensures authentication works via cookies during SSR
      request = request.clone({
        withCredentials: true,
      });
    }

    return next.handle(request);
  }
}

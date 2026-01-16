import { Injectable, inject, PLATFORM_ID, REQUEST } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StateStorageService {
  private readonly previousUrlKey = 'previousUrl';
  private readonly authenticationKey = 'jhi-authenticationToken';
  private readonly localeKey = 'locale';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT, { optional: true });
  // Inject the incoming request during SSR (available only on server)
  private readonly request = inject(REQUEST, { optional: true });

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Get cookie value by name
   * Works in both browser (from document.cookie) and server (from incoming request headers)
   */
  private getCookie(name: string): string | null {
    // Server-side: read from incoming request headers
    if (!this.isBrowser && this.request) {
      // REQUEST can be Web API Request or Node.js IncomingMessage
      let cookies: string | null = null;

      // Check if it's a Web API Request (has headers.get method)
      if (typeof (this.request as any).headers?.get === 'function') {
        cookies = (this.request as any).headers.get('cookie');
      }
      // Check if it's a Node.js IncomingMessage (has headers.cookie property)
      else if ((this.request as any).headers?.cookie) {
        cookies = (this.request as any).headers.cookie;
      }

      if (cookies) {
        const nameEQ = name + '=';
        const ca = cookies.split(';');
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) === ' ') c = c.substring(1, c.length);
          if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
          }
        }
      }
      return null;
    }

    // Browser: read from document.cookie
    if (this.isBrowser && this.document) {
      const nameEQ = name + '=';
      const ca = this.document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
      }
    }
    return null;
  }

  /**
   * Set cookie value (browser only)
   */
  private setCookie(name: string, value: string, days?: number): void {
    if (!this.isBrowser || !this.document) {
      return;
    }

    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    this.document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Strict';
  }

  /**
   * Delete cookie (browser only)
   */
  private deleteCookie(name: string): void {
    if (this.isBrowser && this.document) {
      this.document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  }

  storeUrl(url: string): void {
    if (this.isBrowser) {
      sessionStorage.setItem(this.previousUrlKey, JSON.stringify(url));
    }
    // For SSR, URL can be stored in cookie if needed
    this.setCookie(this.previousUrlKey, JSON.stringify(url));
  }

  getUrl(): string | null {
    // Try cookie first (works in both browser and server)
    const cookieUrl = this.getCookie(this.previousUrlKey);
    if (cookieUrl) {
      try {
        return JSON.parse(cookieUrl) as string;
      } catch {
        return cookieUrl;
      }
    }

    // Fallback to sessionStorage (browser only)
    if (this.isBrowser) {
      const previousUrl = sessionStorage.getItem(this.previousUrlKey);
      return previousUrl ? (JSON.parse(previousUrl) as string | null) : previousUrl;
    }
    return null;
  }

  clearUrl(): void {
    if (this.isBrowser) {
      sessionStorage.removeItem(this.previousUrlKey);
    }
    this.deleteCookie(this.previousUrlKey);
  }

  /**
   * Store authentication token
   * Uses cookies for SSR/SSG compatibility, with localStorage/sessionStorage as fallback for CSR
   */
  storeAuthenticationToken(authenticationToken: string, rememberMe: boolean): void {
    const tokenValue = JSON.stringify(authenticationToken);
    this.clearAuthenticationToken();

    // Primary: Use cookies (works in browser and server for SSR/SSG)
    if (rememberMe) {
      // Persistent cookie (30 days)
      this.setCookie(this.authenticationKey, tokenValue, 30);
    } else {
      // Session cookie (expires when browser closes)
      this.setCookie(this.authenticationKey, tokenValue);
    }

    // Fallback: Use localStorage/sessionStorage for CSR-only scenarios
    if (this.isBrowser) {
      if (rememberMe) {
        localStorage.setItem(this.authenticationKey, tokenValue);
      } else {
        sessionStorage.setItem(this.authenticationKey, tokenValue);
      }
    }
  }

  /**
   * Get authentication token
   * Checks cookies first (for SSR/SSG), then falls back to localStorage/sessionStorage (for CSR)
   */
  getAuthenticationToken(): string | null {
    // Primary: Try cookie first (works in both browser and server)
    const cookieToken = this.getCookie(this.authenticationKey);
    if (cookieToken) {
      try {
        return JSON.parse(cookieToken) as string;
      } catch {
        return cookieToken;
      }
    }

    // Fallback: Try localStorage/sessionStorage (browser only, CSR)
    if (this.isBrowser) {
      const storageToken = localStorage.getItem(this.authenticationKey) ?? sessionStorage.getItem(this.authenticationKey);
      if (storageToken) {
        try {
          return JSON.parse(storageToken) as string;
        } catch {
          return storageToken;
        }
      }
    }

    return null;
  }

  clearAuthenticationToken(): void {
    // Clear cookie
    this.deleteCookie(this.authenticationKey);

    // Clear localStorage/sessionStorage (browser only)
    if (this.isBrowser) {
      sessionStorage.removeItem(this.authenticationKey);
      localStorage.removeItem(this.authenticationKey);
    }
  }

  storeLocale(locale: string): void {
    if (this.isBrowser) {
      sessionStorage.setItem(this.localeKey, locale);
    }
    // Store in cookie for SSR compatibility
    this.setCookie(this.localeKey, locale);
  }

  getLocale(): string | null {
    // Try cookie first (works in both browser and server)
    const cookieLocale = this.getCookie(this.localeKey);
    if (cookieLocale) {
      return cookieLocale;
    }

    // Fallback to sessionStorage (browser only)
    if (this.isBrowser) {
      return sessionStorage.getItem(this.localeKey);
    }
    return null;
  }

  clearLocale(): void {
    if (this.isBrowser) {
      sessionStorage.removeItem(this.localeKey);
    }
    this.deleteCookie(this.localeKey);
  }
}

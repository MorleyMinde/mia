import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANGUAGE_KEY = 'app_language';
  
  // Signal to track current language
  currentLanguage = signal<'en' | 'sw'>('en');
  
  constructor(private translate: TranslateService) {
    this.initializeLanguage();
  }
  
  /**
   * Initialize language from localStorage or default to 'en'
   */
  private initializeLanguage(): void {
    const savedLanguage = localStorage.getItem(this.LANGUAGE_KEY) as 'en' | 'sw' | null;
    const languageToUse = savedLanguage || 'en';
    
    this.setLanguage(languageToUse);
  }
  
  /**
   * Set the application language
   * @param lang Language code ('en' or 'sw')
   */
  setLanguage(lang: 'en' | 'sw'): void {
    this.translate.use(lang);
    this.currentLanguage.set(lang);
    localStorage.setItem(this.LANGUAGE_KEY, lang);
  }
  
  /**
   * Toggle between English and Swahili
   */
  toggleLanguage(): void {
    const newLang = this.currentLanguage() === 'en' ? 'sw' : 'en';
    this.setLanguage(newLang);
  }
  
  /**
   * Get the current language code
   */
  getCurrentLanguage(): 'en' | 'sw' {
    return this.currentLanguage();
  }
  
  /**
   * Get instant translation without subscribing
   * @param key Translation key
   * @param params Optional interpolation parameters
   */
  instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }
}


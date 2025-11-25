import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mtuniafya');
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);

  constructor() {
    // Initialize translate service
    this.translate.addLangs(['en', 'sw']);
    this.translate.setDefaultLang('en');
    
    // Use the language service to set initial language (will restore from localStorage if available)
    const currentLang = this.languageService.getCurrentLanguage();
    this.translate.use(currentLang);
  }
}

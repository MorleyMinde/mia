# Internationalization (i18n) Implementation Guide

## Overview

Your application now supports both **English** and **Swahili** languages using the ngx-translate library. Users can switch between languages seamlessly, and their language preference is persisted in localStorage.

## Features

- ✅ **Full app translation**: All user-facing text is translated
- ✅ **Language switcher**: Easy toggle between English and Swahili
- ✅ **Persistent preference**: Selected language is saved in localStorage
- ✅ **Auth integration**: Language selection in signup/signin syncs with app language
- ✅ **Real-time switching**: No page reload required to change language

## File Structure

```
src/
├── assets/
│   └── i18n/
│       ├── en.json          # English translations
│       └── sw.json          # Swahili translations
├── app/
│   ├── core/
│   │   └── services/
│   │       └── language.service.ts    # Language management service
│   └── shared/
│       └── components/
│           └── language-switcher/     # Language switcher component
```

## Translation Files

### English (en.json)
Contains all English translations organized by feature:
- `app`: Application-wide text
- `common`: Shared/common text (buttons, actions, etc.)
- `auth`: Authentication-related text
- `patient`: Patient dashboard text
- `provider`: Provider dashboard text
- `record`: Health record entry form text
- `status`: Health status labels
- `languages`: Language names

### Swahili (sw.json)
Contains all Swahili translations with the same structure as English.

## Usage

### Using Translations in Templates

Use the `translate` pipe for simple translations:

```html
<h1>{{ 'app.title' | translate }}</h1>
<button>{{ 'common.save' | translate }}</button>
```

For conditional translations:

```html
<span>{{ todayEntries().length === 1 ? ('patient.entry' | translate) : ('patient.entries' | translate) }}</span>
```

For placeholders and attributes:

```html
<input [placeholder]="'record.startTypingMedication' | translate">
<button [attr.aria-label]="'auth.profile' | translate">
```

### Using the Language Service

The `LanguageService` provides methods to manage language preferences:

```typescript
import { LanguageService } from './core/services/language.service';

constructor(private languageService: LanguageService) {}

// Get current language
const currentLang = this.languageService.getCurrentLanguage(); // 'en' or 'sw'

// Set language
this.languageService.setLanguage('sw');

// Toggle between languages
this.languageService.toggleLanguage();

// Get instant translation (without subscribing)
const text = this.languageService.instant('common.save');
```

### Language Switcher Component

The language switcher is already integrated into:
- Patient shell header
- Provider shell header
- Authentication page

To add it to a new component:

```typescript
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

@Component({
  // ...
  imports: [LanguageSwitcherComponent]
})
```

```html
<app-language-switcher />
```

## Adding New Translations

1. **Open both translation files**: `src/assets/i18n/en.json` and `src/assets/i18n/sw.json`

2. **Add the same key to both files**:

**en.json:**
```json
{
  "myFeature": {
    "newKey": "New English text"
  }
}
```

**sw.json:**
```json
{
  "myFeature": {
    "newKey": "Maandishi mapya ya Kiswahili"
  }
}
```

3. **Use the translation** in your template:
```html
<p>{{ 'myFeature.newKey' | translate }}</p>
```

## Translation Keys Naming Convention

Follow this structure for organization:
- Use camelCase for keys
- Group related translations under a common parent
- Be descriptive but concise

Example:
```json
{
  "featureName": {
    "actionName": "Action Text",
    "labelName": "Label Text",
    "messageName": "Message Text"
  }
}
```

## Language Persistence

The selected language is automatically saved to localStorage with the key `app_language`. When the app loads:
1. It checks localStorage for a saved preference
2. If found, uses that language
3. If not found, defaults to English

## Testing Different Languages

1. **Via UI**: Click the language switcher button (🌐 EN/SW) in the header
2. **Via Browser Console**:
   ```javascript
   localStorage.setItem('app_language', 'sw'); // Set to Swahili
   window.location.reload(); // Reload to apply
   ```
3. **Via Auth Form**: Select language during signup/signin

## Important Components

### Components with Translations

All major components now support translations:
- ✅ Patient shell and navigation
- ✅ Patient today dashboard
- ✅ Patient profile
- ✅ Patient record entry form
- ✅ Provider shell and navigation
- ✅ Provider home
- ✅ Provider patients search
- ✅ Authentication (signup/signin)

### Components to Update

When adding new text to the application:
1. Add the translation keys to both `en.json` and `sw.json`
2. Import `TranslateModule` in your component
3. Use the `translate` pipe in your template

Example:
```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  // ...
  imports: [TranslateModule]
})
```

## Troubleshooting

### Translation Not Showing

1. **Check the translation key exists** in both `en.json` and `sw.json`
2. **Verify TranslateModule is imported** in your component
3. **Check the browser console** for translation errors
4. **Ensure the pipe syntax is correct**: `{{ 'key' | translate }}`

### Language Not Switching

1. **Check the language service** is properly injected
2. **Verify localStorage** has the correct value: `localStorage.getItem('app_language')`
3. **Clear localStorage** and try again: `localStorage.removeItem('app_language')`

### Missing Translations

If a translation key is not found, ngx-translate will display the key itself. Check:
1. The key is spelled correctly
2. The key exists in both language files
3. The JSON structure is valid

## Future Enhancements

Consider adding:
- More languages (e.g., French, Arabic)
- Translation management UI for admins
- Automatic language detection based on browser settings
- RTL (Right-to-Left) support for Arabic
- Translation completeness checker

---

**Version**: 1.0  
**Last Updated**: November 2025


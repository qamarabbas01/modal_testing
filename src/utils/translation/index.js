/**
 * Translation Utilities - Central export file
 * 
 * Exports all translation-related utilities:
 * - Translation loading with section-based lazy loading
 * - Locale management and resolution
 */

// Export translation loader functions
export {
  loadTranslationsForSection,
  preloadTranslationsForSections,
  areTranslationsLoadedForSection,
  clearTranslationCaches,
  getTranslationStatistics
} from './translationLoader.js';

// Export locale manager functions
export {
  resolveActiveLocale,
  setActiveLocale,
  getActiveLocale,
  getSupportedLocales,
  isLocaleSupported,
  getDefaultLocale,
  getLocaleDisplayName,
  switchToLocale,
  resetLocaleToDefault,
  getLocalePreferenceOrder
} from './localeManager.js';


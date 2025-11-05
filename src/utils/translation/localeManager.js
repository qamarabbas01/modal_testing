/**
 * LocaleManager - Locale resolution and management
 * 
 * Handles locale selection with priority chain:
 * 1. URL (path or query parameter)
 * 2. User manual selection (cached)
 * 3. Browser default
 * 4. Fallback to English
 * 
 * All operations tracked with global window.performanceTracker.
 */

import { log } from '../common/logHandler.js';
import { logError } from '../common/errorHandler.js';
import { getValueFromCache, setValueWithExpiration } from '../common/cacheHandler.js';

// Supported locales
const SUPPORTED_LOCALES = ['en', 'vi'];
const DEFAULT_LOCALE = 'en';

// Current active locale
let currentActiveLocale = null;

// Cache key for locale preference
const LOCALE_CACHE_KEY = 'user_locale_preference';

/**
 * Resolve the active locale using priority chain
 * 
 * Priority order:
 * 1. URL parameter (?locale=vi or /vi/path)
 * 2. Cached user selection
 * 3. Browser language
 * 4. Default fallback (en)
 * 
 * @returns {string} - Resolved locale code
 */
export function resolveActiveLocale() {
  log('localeManager.js', 'resolveActiveLocale', 'start', 'Resolving active locale', {});

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'resolveLocale',
      file: 'localeManager.js',
      method: 'resolveActiveLocale',
      flag: 'locale-resolve',
      purpose: 'Resolve active locale from priority chain'
    });
  }

  try {
    // 1. Check URL for locale
    const urlLocale = getLocaleFromUrl();
    if (urlLocale) {
      log('localeManager.js', 'resolveActiveLocale', 'info', 'Locale resolved from URL', { locale: urlLocale });
      
      if (window.performanceTracker) {
        window.performanceTracker.step({
          step: 'localeResolvedFromUrl',
          file: 'localeManager.js',
          method: 'resolveActiveLocale',
          flag: 'url-source',
          purpose: `Locale from URL: ${urlLocale}`
        });
      }
      
      currentActiveLocale = urlLocale;
      log('localeManager.js', 'resolveActiveLocale', 'return', 'Returning URL locale', { locale: urlLocale });
      return urlLocale;
    }

    // 2. Check cached user selection
    const cachedLocale = getValueFromCache(LOCALE_CACHE_KEY);
    if (cachedLocale && SUPPORTED_LOCALES.includes(cachedLocale)) {
      log('localeManager.js', 'resolveActiveLocale', 'info', 'Locale resolved from cache', { locale: cachedLocale });
      
      if (window.performanceTracker) {
        window.performanceTracker.step({
          step: 'localeResolvedFromCache',
          file: 'localeManager.js',
          method: 'resolveActiveLocale',
          flag: 'cache-source',
          purpose: `Locale from cache: ${cachedLocale}`
        });
      }
      
      currentActiveLocale = cachedLocale;
      log('localeManager.js', 'resolveActiveLocale', 'return', 'Returning cached locale', { locale: cachedLocale });
      return cachedLocale;
    }

    // 3. Check browser language
    const browserLocale = getBrowserLocale();
    if (browserLocale) {
      log('localeManager.js', 'resolveActiveLocale', 'info', 'Locale resolved from browser', { locale: browserLocale });
      
      if (window.performanceTracker) {
        window.performanceTracker.step({
          step: 'localeResolvedFromBrowser',
          file: 'localeManager.js',
          method: 'resolveActiveLocale',
          flag: 'browser-source',
          purpose: `Locale from browser: ${browserLocale}`
        });
      }
      
      currentActiveLocale = browserLocale;
      log('localeManager.js', 'resolveActiveLocale', 'return', 'Returning browser locale', { locale: browserLocale });
      return browserLocale;
    }

    // 4. Use default fallback
    log('localeManager.js', 'resolveActiveLocale', 'info', 'Using default locale', { locale: DEFAULT_LOCALE });
    
    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'localeResolvedToDefault',
        file: 'localeManager.js',
        method: 'resolveActiveLocale',
        flag: 'default-source',
        purpose: `Using default locale: ${DEFAULT_LOCALE}`
      });
    }
    
    currentActiveLocale = DEFAULT_LOCALE;
    log('localeManager.js', 'resolveActiveLocale', 'return', 'Returning default locale', { locale: DEFAULT_LOCALE });
    return DEFAULT_LOCALE;

  } catch (error) {
    logError('localeManager.js', 'resolveActiveLocale', 'Error resolving locale', error);
    currentActiveLocale = DEFAULT_LOCALE;
    log('localeManager.js', 'resolveActiveLocale', 'return', 'Returning default locale due to error', { locale: DEFAULT_LOCALE });
    return DEFAULT_LOCALE;
  }
}

/**
 * Get locale from URL (query parameter or path)
 * 
 * @returns {string|null} - Locale code or null if not found
 */
function getLocaleFromUrl() {
  log('localeManager.js', 'getLocaleFromUrl', 'start', 'Getting locale from URL', {});

  try {
    // Check query parameter: ?locale=vi
    const urlParams = new URLSearchParams(window.location.search);
    const queryLocale = urlParams.get('locale');
    
    if (queryLocale && SUPPORTED_LOCALES.includes(queryLocale)) {
      log('localeManager.js', 'getLocaleFromUrl', 'info', 'Found locale in query parameter', { locale: queryLocale });
      log('localeManager.js', 'getLocaleFromUrl', 'return', 'Returning query locale', { locale: queryLocale });
      return queryLocale;
    }

    // Check path: /vi/dashboard
    const pathParts = window.location.pathname.split('/').filter(part => part.length > 0);
    const firstPathPart = pathParts[0];
    
    if (firstPathPart && SUPPORTED_LOCALES.includes(firstPathPart)) {
      log('localeManager.js', 'getLocaleFromUrl', 'info', 'Found locale in path', { locale: firstPathPart });
      log('localeManager.js', 'getLocaleFromUrl', 'return', 'Returning path locale', { locale: firstPathPart });
      return firstPathPart;
    }

    log('localeManager.js', 'getLocaleFromUrl', 'return', 'No locale found in URL', {});
    return null;
  } catch (error) {
    logError('localeManager.js', 'getLocaleFromUrl', 'Error getting locale from URL', error);
    log('localeManager.js', 'getLocaleFromUrl', 'return', 'Returning null due to error', {});
    return null;
  }
}

/**
 * Get browser's preferred locale
 * 
 * @returns {string|null} - Locale code or null if not supported
 */
function getBrowserLocale() {
  log('localeManager.js', 'getBrowserLocale', 'start', 'Getting browser locale', {});

  try {
    // Get browser language
    const browserLanguage = navigator.language || navigator.userLanguage;
    
    if (!browserLanguage) {
      log('localeManager.js', 'getBrowserLocale', 'return', 'No browser language available', {});
      return null;
    }

    // Extract base language code (e.g., 'en' from 'en-US')
    const baseLanguage = browserLanguage.split('-')[0].toLowerCase();

    // Check if supported
    if (SUPPORTED_LOCALES.includes(baseLanguage)) {
      log('localeManager.js', 'getBrowserLocale', 'info', 'Browser locale is supported', { locale: baseLanguage });
      log('localeManager.js', 'getBrowserLocale', 'return', 'Returning browser locale', { locale: baseLanguage });
      return baseLanguage;
    }

    log('localeManager.js', 'getBrowserLocale', 'info', 'Browser locale not supported', { 
      browserLanguage, 
      supportedLocales: SUPPORTED_LOCALES 
    });
    log('localeManager.js', 'getBrowserLocale', 'return', 'Returning null - locale not supported', {});
    return null;
  } catch (error) {
    logError('localeManager.js', 'getBrowserLocale', 'Error getting browser locale', error);
    log('localeManager.js', 'getBrowserLocale', 'return', 'Returning null due to error', {});
    return null;
  }
}

/**
 * Set the active locale
 * Updates URL and cache
 * 
 * @param {string} localeCode - Locale code to set
 * @param {object} options - Options { updateUrl: boolean }
 * @returns {boolean} - True if locale was set successfully
 */
export function setActiveLocale(localeCode, options = {}) {
  log('localeManager.js', 'setActiveLocale', 'start', 'Setting active locale', { localeCode, options });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'setLocale',
      file: 'localeManager.js',
      method: 'setActiveLocale',
      flag: 'locale-set',
      purpose: `Set active locale to: ${localeCode}`
    });
  }

  // Validate locale
  if (!SUPPORTED_LOCALES.includes(localeCode)) {
    log('localeManager.js', 'setActiveLocale', 'warn', 'Unsupported locale provided', { 
      localeCode, 
      supportedLocales: SUPPORTED_LOCALES 
    });
    log('localeManager.js', 'setActiveLocale', 'return', 'Returning false - unsupported locale', { localeCode });
    return false;
  }

  // Default options
  const { updateUrl = true } = options;

  // Set as current active locale
  currentActiveLocale = localeCode;

  // Cache the locale preference (90 days)
  setValueWithExpiration(LOCALE_CACHE_KEY, localeCode, 7776000000);

  log('localeManager.js', 'setActiveLocale', 'success', 'Active locale set', { 
    localeCode,
    updateUrl
  });

  // Update URL if requested
  if (updateUrl) {
    updateUrlWithLocale(localeCode);
  }

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'localeSet',
      file: 'localeManager.js',
      method: 'setActiveLocale',
      flag: 'locale-updated',
      purpose: `Locale updated to: ${localeCode}`
    });
  }

  log('localeManager.js', 'setActiveLocale', 'return', 'Returning success', { localeCode, success: true });
  return true;
}

/**
 * Update URL with locale
 * Adds or updates locale query parameter
 * 
 * @param {string} localeCode - Locale code
 * @returns {void}
 */
function updateUrlWithLocale(localeCode) {
  log('localeManager.js', 'updateUrlWithLocale', 'start', 'Updating URL with locale', { localeCode });

  try {
    // Get current URL
    const currentUrl = new URL(window.location.href);
    
    // Update or add locale query parameter
    currentUrl.searchParams.set('locale', localeCode);

    // Update URL without page reload (using pushState)
    window.history.pushState({}, '', currentUrl.toString());

    log('localeManager.js', 'updateUrlWithLocale', 'success', 'URL updated with locale', { 
      localeCode,
      newUrl: currentUrl.toString()
    });
    log('localeManager.js', 'updateUrlWithLocale', 'return', 'URL update complete', {});
  } catch (error) {
    logError('localeManager.js', 'updateUrlWithLocale', 'Failed to update URL with locale', error, { localeCode });
    log('localeManager.js', 'updateUrlWithLocale', 'return', 'Returning after error', {});
  }
}

/**
 * Get current active locale
 * 
 * @returns {string} - Current active locale code
 */
export function getActiveLocale() {
  log('localeManager.js', 'getActiveLocale', 'start', 'Getting active locale', {});

  // If not set, resolve it
  if (!currentActiveLocale) {
    currentActiveLocale = resolveActiveLocale();
  }

  log('localeManager.js', 'getActiveLocale', 'return', 'Returning active locale', { locale: currentActiveLocale });
  return currentActiveLocale;
}

/**
 * Get all supported locales
 * 
 * @returns {Array<string>} - Array of supported locale codes
 */
export function getSupportedLocales() {
  log('localeManager.js', 'getSupportedLocales', 'return', 'Returning supported locales', { locales: SUPPORTED_LOCALES });
  return [...SUPPORTED_LOCALES];
}

/**
 * Check if a locale is supported
 * 
 * @param {string} localeCode - Locale code to check
 * @returns {boolean} - True if locale is supported
 */
export function isLocaleSupported(localeCode) {
  const supported = SUPPORTED_LOCALES.includes(localeCode);
  log('localeManager.js', 'isLocaleSupported', 'return', 'Returning locale support status', { localeCode, supported });
  return supported;
}

/**
 * Get default locale
 * 
 * @returns {string} - Default locale code
 */
export function getDefaultLocale() {
  log('localeManager.js', 'getDefaultLocale', 'return', 'Returning default locale', { locale: DEFAULT_LOCALE });
  return DEFAULT_LOCALE;
}

/**
 * Get locale display name
 * 
 * @param {string} localeCode - Locale code
 * @returns {string} - Human-readable locale name
 */
export function getLocaleDisplayName(localeCode) {
  const localeNames = {
    'en': 'English',
    'vi': 'Tiếng Việt'
  };

  const displayName = localeNames[localeCode] || localeCode;
  log('localeManager.js', 'getLocaleDisplayName', 'return', 'Returning locale display name', { localeCode, displayName });
  return displayName;
}

/**
 * Switch to a different locale
 * Convenience method that sets locale
 * 
 * @param {string} newLocaleCode - New locale code
 * @returns {Promise<boolean>} - True if switch was successful
 */
export async function switchToLocale(newLocaleCode) {
  log('localeManager.js', 'switchToLocale', 'start', 'Switching to new locale', { newLocaleCode });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'switchLocale',
      file: 'localeManager.js',
      method: 'switchToLocale',
      flag: 'locale-switch',
      purpose: `Switch from ${currentActiveLocale} to ${newLocaleCode}`
    });
  }

  // Set new locale
  const success = setActiveLocale(newLocaleCode);

  if (success) {
    log('localeManager.js', 'switchToLocale', 'success', 'Locale switched successfully', { 
      oldLocale: currentActiveLocale,
      newLocale: newLocaleCode
    });

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'localeSwitched',
        file: 'localeManager.js',
        method: 'switchToLocale',
        flag: 'switch-complete',
        purpose: `Locale switch complete: ${newLocaleCode}`
      });
    }
  }

  log('localeManager.js', 'switchToLocale', 'return', 'Returning switch result', { success });
  return success;
}

/**
 * Reset locale to default
 * 
 * @returns {boolean} - True if reset was successful
 */
export function resetLocaleToDefault() {
  log('localeManager.js', 'resetLocaleToDefault', 'start', 'Resetting locale to default', {});
  const success = setActiveLocale(DEFAULT_LOCALE);
  log('localeManager.js', 'resetLocaleToDefault', 'return', 'Returning reset result', { success });
  return success;
}

/**
 * Get locale preference order
 * Returns the order in which locales are checked
 * 
 * @returns {Array<object>} - Array of preference sources with current values
 */
export function getLocalePreferenceOrder() {
  const order = [
    {
      source: 'url',
      value: getLocaleFromUrl(),
      priority: 1
    },
    {
      source: 'cache',
      value: getValueFromCache(LOCALE_CACHE_KEY),
      priority: 2
    },
    {
      source: 'browser',
      value: getBrowserLocale(),
      priority: 3
    },
    {
      source: 'default',
      value: DEFAULT_LOCALE,
      priority: 4
    }
  ];
  
  log('localeManager.js', 'getLocalePreferenceOrder', 'return', 'Returning preference order', { sourceCount: order.length });
  return order;
}

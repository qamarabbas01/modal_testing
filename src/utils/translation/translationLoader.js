/**
 * TranslationLoader - Lazy load translations per section with caching
 * 
 * Loads translation files dynamically based on section and locale.
 * Always loads English first as fallback, then user's preferred locale.
 * All operations tracked with global window.performanceTracker.
 */

import { log } from '../common/logHandler.js';
import { logError } from '../common/errorHandler.js';
import { getValueFromCache, setValueWithExpiration } from '../common/cacheHandler.js';

// Cache configuration for translations
const TRANSLATION_CACHE_KEY_PREFIX = 'translation_';
const TRANSLATION_CACHE_TTL = 3600000; // 1 hour

// Track which translations are currently loading to prevent duplicates
const translationsLoadingInProgress = new Set();

// Track loaded translations
const loadedTranslations = new Map();

/**
 * Validate that a translation file exists before attempting to load it
 * This prevents runtime import errors for missing translation files
 *
 * @param {string} sectionName - Section name
 * @param {string} localeCode - Locale code
 * @returns {Promise<boolean>} - True if file exists, false otherwise
 */
async function validateTranslationFileExists(sectionName, localeCode) {
  log('translationLoader.js', 'validateTranslationFileExists', 'start', 'Validating translation file existence', { sectionName, localeCode });

  try {
    // Try to import the file - if it fails, file doesn't exist
    await import(/* @vite-ignore */ `../../i18n/section-${sectionName}/${localeCode}.json`);
    log('translationLoader.js', 'validateTranslationFileExists', 'success', 'Translation file exists', { sectionName, localeCode });
    log('translationLoader.js', 'validateTranslationFileExists', 'return', 'Returning file exists status', { exists: true });
    return true;
  } catch (error) {
    log('translationLoader.js', 'validateTranslationFileExists', 'file-missing', 'Translation file does not exist', {
      sectionName,
      localeCode,
      error: error.message
    });
    log('translationLoader.js', 'validateTranslationFileExists', 'return', 'Returning file missing status', { exists: false });
    return false;
  }
}

/**
 * Load translations for a specific section and locale
 * Always loads English first, then the requested locale if different
 * Validates file existence before attempting to load
 *
 * @param {string} sectionName - Section to load translations for
 * @param {string} localeCode - Locale code (e.g., 'en', 'vi')
 * @returns {Promise<object>} - Translation object or empty object on failure
 */
export async function loadTranslationsForSection(sectionName, localeCode) {
  log('translationLoader.js', 'loadTranslationsForSection', 'start', 'Loading translations for section', {
    sectionName,
    localeCode
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'loadSectionTranslations',
      file: 'translationLoader.js',
      method: 'loadTranslationsForSection',
      flag: 'translation-load',
      purpose: `Load translations for section: ${sectionName}, locale: ${localeCode}`
    });
  }

  // Validate that translation files exist before attempting to load
  const englishExists = await validateTranslationFileExists(sectionName, 'en');
  const localeExists = localeCode === 'en' ? true : await validateTranslationFileExists(sectionName, localeCode);

  if (!englishExists) {
    log('translationLoader.js', 'loadTranslationsForSection', 'error', 'English translation file missing - cannot load translations', {
      sectionName,
      localeCode
    });
    log('translationLoader.js', 'loadTranslationsForSection', 'return', 'Returning empty object due to missing English file', {});
    return {};
  }

  if (!localeExists) {
    log('translationLoader.js', 'loadTranslationsForSection', 'warn', 'Requested locale translation file missing, will use English only', {
      sectionName,
      localeCode
    });
  }

  // Create cache key
  const cacheKey = TRANSLATION_CACHE_KEY_PREFIX + sectionName + '_' + localeCode;

  // Check cache first
  const cachedTranslations = getValueFromCache(cacheKey);
  if (cachedTranslations) {
    log('translationLoader.js', 'loadTranslationsForSection', 'cache-hit', 'Translations loaded from cache', {
      sectionName,
      localeCode
    });

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'translationCacheHit',
        file: 'translationLoader.js',
        method: 'loadTranslationsForSection',
        flag: 'cache-hit',
        purpose: `Translations found in cache for ${sectionName}/${localeCode}`
      });
    }

    log('translationLoader.js', 'loadTranslationsForSection', 'return', 'Returning cached translations', { keyCount: Object.keys(cachedTranslations).length });
    return cachedTranslations;
  }

  // Check if already loading this translation
  const loadingKey = `${sectionName}_${localeCode}`;
  if (translationsLoadingInProgress.has(loadingKey)) {
    log('translationLoader.js', 'loadTranslationsForSection', 'in-progress', 'Translation load already in progress, waiting', {
      sectionName,
      localeCode
    });

    // Wait for existing load to complete
    const result = await waitForTranslationLoad(loadingKey);
    log('translationLoader.js', 'loadTranslationsForSection', 'return', 'Returning translations from concurrent load', { keyCount: Object.keys(result).length });
    return result;
  }

  // Mark as loading
  translationsLoadingInProgress.add(loadingKey);

  // Load translations
  let translations = {};
  try {
    // Load English first as base fallback
    const englishTranslations = await loadTranslationFile(sectionName, 'en');

    // If requesting English, we're done
    if (localeCode === 'en') {
      translations = englishTranslations;
    } else if (localeExists) {
      // Load requested locale only if it exists
      const localeTranslations = await loadTranslationFile(sectionName, localeCode);

      // Merge English (base) with locale (override)
      translations = {
        ...englishTranslations,
        ...localeTranslations
      };

      log('translationLoader.js', 'loadTranslationsForSection', 'merged', 'Translations loaded and merged', {
        sectionName,
        localeCode,
        englishKeys: Object.keys(englishTranslations).length,
        localeKeys: Object.keys(localeTranslations).length
      });
    } else {
      // Only English available
      translations = englishTranslations;
      log('translationLoader.js', 'loadTranslationsForSection', 'english-only', 'Using English translations only (locale file missing)', {
        sectionName,
        localeCode,
        englishKeys: Object.keys(englishTranslations).length
      });
    }
  } catch (error) {
    logError('translationLoader.js', 'loadTranslationsForSection', 'Failed to load translations', error, { sectionName, localeCode });
    translations = {}; // Return empty object on error
  }

  // Remove from loading set
  translationsLoadingInProgress.delete(loadingKey);

  // Cache the loaded translations
  setValueWithExpiration(cacheKey, translations, TRANSLATION_CACHE_TTL);

  // Store in memory map
  loadedTranslations.set(loadingKey, translations);

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'translationsLoaded',
      file: 'translationLoader.js',
      method: 'loadTranslationsForSection',
      flag: 'load-complete',
      purpose: `Translations loaded for ${sectionName}/${localeCode}`
    });
  }

  log('translationLoader.js', 'loadTranslationsForSection', 'return', 'Returning loaded translations', {
    sectionName,
    localeCode,
    keyCount: Object.keys(translations).length
  });
  return translations;
}

/**
 * Load a single translation file
 * Uses dynamic import to lazy-load JSON files
 * 
 * @param {string} sectionName - Section name
 * @param {string} localeCode - Locale code
 * @returns {Promise<object>} - Translation object
 */
async function loadTranslationFile(sectionName, localeCode) {
  log('translationLoader.js', 'loadTranslationFile', 'start', 'Loading translation file', {
    sectionName,
    localeCode
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'loadTranslationFile',
      file: 'translationLoader.js',
      method: 'loadTranslationFile',
      flag: 'file-load',
      purpose: `Load file: section-${sectionName}/${localeCode}.json`
    });
  }

  try {
    // Dynamically import translation JSON file
    // Note: Vite will handle this as a separate chunk
    const translationModule = await import(/* @vite-ignore */ `../../i18n/section-${sectionName}/${localeCode}.json`);

    // Extract default export
    const translations = translationModule.default || translationModule;

    log('translationLoader.js', 'loadTranslationFile', 'success', 'Translation file loaded successfully', {
      sectionName,
      localeCode,
      keyCount: Object.keys(translations).length
    });

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'translationFileLoaded',
        file: 'translationLoader.js',
        method: 'loadTranslationFile',
        flag: 'file-success',
        purpose: `File loaded: section-${sectionName}/${localeCode}.json`
      });
    }

    log('translationLoader.js', 'loadTranslationFile', 'return', 'Returning loaded translations', { keyCount: Object.keys(translations).length });
    return translations;
  } catch (error) {
    logError('translationLoader.js', 'loadTranslationFile', 'Failed to load translation file', error, {
      sectionName,
      localeCode
    });

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'translationFileError',
        file: 'translationLoader.js',
        method: 'loadTranslationFile',
        flag: 'file-error',
        purpose: `Failed to load: section-${sectionName}/${localeCode}.json`
      });
    }

    log('translationLoader.js', 'loadTranslationFile', 'return', 'Returning empty object due to error', {});
    return {};
  }
}

/**
 * Wait for an in-progress translation load to complete
 * 
 * @param {string} loadingKey - Key of translation being loaded
 * @returns {Promise<object>} - Loaded translations
 */
async function waitForTranslationLoad(loadingKey) {
  log('translationLoader.js', 'waitForTranslationLoad', 'start', 'Waiting for translation load', { loadingKey });

  // Poll until translation is loaded or timeout
  const maxWaitTime = 5000; // 5 seconds
  const pollInterval = 100; // 100ms
  let waitedTime = 0;

  while (waitedTime < maxWaitTime) {
    // Check if translation is now loaded
    if (loadedTranslations.has(loadingKey)) {
      const result = loadedTranslations.get(loadingKey);
      log('translationLoader.js', 'waitForTranslationLoad', 'return', 'Returning loaded translation', { loadingKey });
      return result;
    }

    // Check if loading has finished (even if failed)
    if (!translationsLoadingInProgress.has(loadingKey)) {
      log('translationLoader.js', 'waitForTranslationLoad', 'warn', 'Loading finished but not in map', { loadingKey });
      log('translationLoader.js', 'waitForTranslationLoad', 'return', 'Returning empty object', {});
      return {};
    }

    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    waitedTime += pollInterval;
  }

  // Timeout - return empty object
  log('translationLoader.js', 'waitForTranslationLoad', 'warn', 'Translation load timeout', { loadingKey, waitedTime });
  log('translationLoader.js', 'waitForTranslationLoad', 'return', 'Returning empty object due to timeout', {});
  return {};
}

/**
 * Preload translations for multiple sections
 * Loads translations in parallel for better performance
 * 
 * @param {Array<string>} sectionNames - Array of section names
 * @param {string} localeCode - Locale code
 * @returns {Promise<object>} - Map of section name to translations
 */
export async function preloadTranslationsForSections(sectionNames, localeCode) {
  log('translationLoader.js', 'preloadTranslationsForSections', 'start', 'Preloading translations for sections', {
    sectionCount: sectionNames.length,
    sections: sectionNames,
    localeCode
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'preloadBatchTranslations',
      file: 'translationLoader.js',
      method: 'preloadTranslationsForSections',
      flag: 'batch-preload',
      purpose: `Preload translations for ${sectionNames.length} sections`
    });
  }

  // Load all sections in parallel
  const loadPromises = sectionNames.map(sectionName =>
    loadTranslationsForSection(sectionName, localeCode)
      .then(translations => ({ sectionName, translations, success: true }))
      .catch(error => {
        logError('translationLoader.js', 'preloadTranslationsForSections', 'Section translation load failed', error, { sectionName });
        return { sectionName, translations: {}, success: false, error };
      })
  );

  // Wait for all loads to complete
  const results = await Promise.all(loadPromises);

  // Build result map
  const translationsMap = {};
  results.forEach(result => {
    translationsMap[result.sectionName] = result.translations;
  });

  // Count successes
  const successCount = results.filter(r => r.success).length;

  log('translationLoader.js', 'preloadTranslationsForSections', 'info', 'Batch translation preload completed', {
    totalSections: sectionNames.length,
    successful: successCount,
    failed: sectionNames.length - successCount
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'batchTranslationsLoaded',
      file: 'translationLoader.js',
      method: 'preloadTranslationsForSections',
      flag: 'batch-complete',
      purpose: `Loaded ${successCount}/${sectionNames.length} section translations`
    });
  }

  log('translationLoader.js', 'preloadTranslationsForSections', 'return', 'Returning translations map', { sectionCount: Object.keys(translationsMap).length });
  return translationsMap;
}

/**
 * Check if translations are loaded for a section
 * 
 * @param {string} sectionName - Section name
 * @param {string} localeCode - Locale code
 * @returns {boolean} - True if translations are loaded
 */
export function areTranslationsLoadedForSection(sectionName, localeCode) {
  const loadingKey = `${sectionName}_${localeCode}`;
  const loaded = loadedTranslations.has(loadingKey);
  log('translationLoader.js', 'areTranslationsLoadedForSection', 'return', 'Returning loaded status', { sectionName, localeCode, loaded });
  return loaded;
}

/**
 * Clear all translation caches
 * Useful for development or language switching
 * 
 * @returns {void}
 */
export function clearTranslationCaches() {
  log('translationLoader.js', 'clearTranslationCaches', 'start', 'Clearing all translation caches', {});

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'clearTranslationCache',
      file: 'translationLoader.js',
      method: 'clearTranslationCaches',
      flag: 'cache-clear',
      purpose: 'Clear all translation caches'
    });
  }

  const count = loadedTranslations.size;
  loadedTranslations.clear();

  log('translationLoader.js', 'clearTranslationCaches', 'success', 'Translation caches cleared', { clearedCount: count });
  log('translationLoader.js', 'clearTranslationCaches', 'return', 'Cache clear complete', {});
}

/**
 * Get translation loading statistics
 * 
 * @returns {object} - Statistics about loaded translations
 */
export function getTranslationStatistics() {
  const stats = {
    loadedCount: loadedTranslations.size,
    loadedSections: Array.from(loadedTranslations.keys()),
    loadingInProgress: Array.from(translationsLoadingInProgress)
  };
  
  log('translationLoader.js', 'getTranslationStatistics', 'return', 'Returning translation statistics', stats);
  return stats;
}

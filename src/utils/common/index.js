/**
 * Common Utilities - Central export file
 * 
 * Exports all common utility functions used throughout the application:
 * - Cache management
 * - Logging
 * - Object safety operations
 * - Error handling
 */

// Export all cache handler functions
export {
  setValueWithExpiration,
  getValueFromCache,
  deleteValueFromCache,
  clearAllCachedValues,
  cleanupExpiredCacheEntries,
  getCurrentCacheSize,
  hasCacheKey
} from './cacheHandler.js';

// Export all log handler functions
export {
  logDebugMessage,
  logInfoMessage,
  logWarningMessage,
  logErrorMessage,
  isLoggerEnabled,
  log
} from './logHandler.js';

// Export all object safety functions
export {
  deepMergePreferChild,
  safelyGetNestedProperty,
  assertValuePresent,
  isValuePresent,
  deepCloneObject
} from './objectSafety.js';

// Export all error handler functions
export {
  handleErrorSilently,
  handleErrorWithFallback,
  handleAsyncErrorWithFallback,
  wrapFunctionWithErrorHandling,
  wrapAsyncFunctionWithErrorHandling,
  validateOrThrowError,
  isErrorObject
} from './errorHandler.js';

// Export global performance tracker
export {
  getGlobalPerformanceTracker,
  performanceTracker
} from './globalPerformanceTracker.js';


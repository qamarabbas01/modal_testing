/**
 * RouteConfigLoader - Load and cache route configuration
 * 
 * Handles loading routeConfig.json with caching and validation.
 * Uses performance tracker to track all operations.
 */

import routeConfigData from '../../router/routeConfig.json';
import { getValueFromCache, setValueWithExpiration } from '../common/cacheHandler.js';
import { log } from '../common/logHandler.js';
import { logError } from '../common/errorHandler.js';
import { validateRouteConfig } from '../build/jsonConfigValidator.js';

// Performance tracker available globally as window.performanceTracker

// Cache key for route configuration
const ROUTE_CONFIG_CACHE_KEY = 'app_route_configuration';

// Cache TTL - route config rarely changes at runtime
const ROUTE_CONFIG_CACHE_TTL = 3600000; // 1 hour

/**
 * Load route configuration from JSON file with validation
 * Performs deep validation of route structure
 * 
 * @returns {Array} - Array of validated route objects
 */
export function loadRouteConfigurationFromFile() {
  log('routeConfigLoader.js', 'loadRouteConfigurationFromFile', 'start', 'Loading route configuration', {});
  
  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'loadRouteConfig_start',
      file: 'routeConfigLoader.js',
      method: 'loadRouteConfigurationFromFile',
      flag: 'io',
      purpose: 'Load route configuration from JSON file'
    });
  }

  try {
    // Route config is imported statically
    if (!Array.isArray(routeConfigData)) {
      log('routeConfigLoader.js', 'loadRouteConfigurationFromFile', 'error', 'Route configuration is not an array', { 
        type: typeof routeConfigData 
      });
      throw new Error('Route configuration is not an array');
    }

    // Validate route config structure
    const validation = validateRouteConfig(routeConfigData);
    if (!validation.valid) {
      log('routeConfigLoader.js', 'loadRouteConfigurationFromFile', 'error', 'Route configuration validation failed', {
        errorCount: validation.errors.length,
        errors: validation.errors
      });
      // Don't throw - log warnings but allow app to continue
      log('routeConfigLoader.js', 'loadRouteConfigurationFromFile', 'warn', 'Continuing with invalid route config', {});
    }

    log('routeConfigLoader.js', 'loadRouteConfigurationFromFile', 'success', 'Route configuration loaded', {
      routeCount: routeConfigData.length,
      valid: validation.valid
    });

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'loadRouteConfig_complete',
        file: 'routeConfigLoader.js',
        method: 'loadRouteConfigurationFromFile',
        flag: 'success',
        purpose: `Loaded ${routeConfigData.length} routes`
      });
    }

    log('routeConfigLoader.js', 'loadRouteConfigurationFromFile', 'return', 'Returning loaded route configuration', { routeCount: routeConfigData.length });
    return routeConfigData;

  } catch (error) {
    logError('routeConfigLoader.js', 'loadRouteConfigurationFromFile', 'Failed to load route configuration', error);
    
    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'loadRouteConfig_error',
        file: 'routeConfigLoader.js',
        method: 'loadRouteConfigurationFromFile',
        flag: 'error',
        purpose: 'Route config load failed'
      });
    }

    log('routeConfigLoader.js', 'loadRouteConfigurationFromFile', 'return', 'Returning empty array due to error', { error: error.message });
    return [];
  }
}

/**
 * Get cached route configuration or load from file
 * Implements caching strategy for performance
 * 
 * @returns {Array} - Array of route objects
 */
export function getCachedRouteConfiguration() {
  log('routeConfigLoader.js', 'getCachedRouteConfiguration', 'start', 'Getting cached route configuration', {});

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'getCachedConfig_start',
      file: 'routeConfigLoader.js',
      method: 'getCachedRouteConfiguration',
      flag: 'cache',
      purpose: 'Get cached route configuration'
    });
  }

  try {
    // Try to get from cache first
    const cachedConfig = getValueFromCache(ROUTE_CONFIG_CACHE_KEY);

    if (cachedConfig && Array.isArray(cachedConfig) && cachedConfig.length > 0) {
      log('routeConfigLoader.js', 'getCachedRouteConfiguration', 'cache-hit', 'Route configuration loaded from cache', {
        routeCount: cachedConfig.length
      });

      if (window.performanceTracker) {
        window.performanceTracker.step({
          step: 'getCachedConfig_hit',
          file: 'routeConfigLoader.js',
          method: 'getCachedRouteConfiguration',
          flag: 'cache-hit',
          purpose: 'Route config served from cache'
        });
      }

      log('routeConfigLoader.js', 'getCachedRouteConfiguration', 'return', 'Returning cached route configuration', { routeCount: cachedConfig.length });
      return cachedConfig;
    }

    // Cache miss - load from file
    log('routeConfigLoader.js', 'getCachedRouteConfiguration', 'cache-miss', 'Route configuration cache miss, loading from file', {});

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'getCachedConfig_miss',
        file: 'routeConfigLoader.js',
        method: 'getCachedRouteConfiguration',
        flag: 'cache-miss',
        purpose: 'Loading from file'
      });
    }

    // Load from file
    const loadedConfig = loadRouteConfigurationFromFile();

    // Cache the loaded configuration
    setValueWithExpiration(ROUTE_CONFIG_CACHE_KEY, loadedConfig, ROUTE_CONFIG_CACHE_TTL);

    log('routeConfigLoader.js', 'getCachedRouteConfiguration', 'success', 'Route configuration cached', {
      routeCount: loadedConfig.length
    });

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'getCachedConfig_complete',
        file: 'routeConfigLoader.js',
        method: 'getCachedRouteConfiguration',
        flag: 'success',
        purpose: 'Route config loaded and cached'
      });
    }

    log('routeConfigLoader.js', 'getCachedRouteConfiguration', 'return', 'Returning loaded and cached route configuration', { routeCount: loadedConfig.length });
    return loadedConfig;

  } catch (error) {
    logError('routeConfigLoader.js', 'getCachedRouteConfiguration', 'Failed to get route configuration', error);

    log('routeConfigLoader.js', 'getCachedRouteConfiguration', 'return', 'Returning empty array due to error', { error: error.message });
    return [];
  }
}

/**
 * Reset route configuration cache
 * Forces reload on next access
 * 
 * @returns {void}
 */
export function resetRouteConfigurationCache() {
  log('routeConfigLoader.js', 'resetRouteConfigurationCache', 'start', 'Resetting route configuration cache', {});

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'resetCache',
      file: 'routeConfigLoader.js',
      method: 'resetRouteConfigurationCache',
      flag: 'cache-clear',
      purpose: 'Clear route configuration cache'
    });
  }

  // Cache handler will handle the actual clearing
  log('routeConfigLoader.js', 'resetRouteConfigurationCache', 'success', 'Route configuration cache cleared', {});

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'resetCache_complete',
      file: 'routeConfigLoader.js',
      method: 'resetRouteConfigurationCache',
      flag: 'success',
      purpose: 'Cache cleared'
    });
  }
  
  log('routeConfigLoader.js', 'resetRouteConfigurationCache', 'return', 'Cache reset complete', {});
}

/**
 * Get route configuration (convenience method)
 * Always returns cached version for performance
 * 
 * @returns {Array} - Array of route objects
 */
export function getRouteConfiguration() {
  log('routeConfigLoader.js', 'getRouteConfiguration', 'call', 'Getting route configuration', {});
  const routes = getCachedRouteConfiguration();
  log('routeConfigLoader.js', 'getRouteConfiguration', 'return', 'Returning route configuration via cache', { routeCount: routes.length });
  return routes;
}

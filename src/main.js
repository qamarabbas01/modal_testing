/**
 * Main Application Entry Point
 * 
 * Initializes:
 * - Performance tracker
 * - Pinia store with persistence
 * - Vue I18n for translations
 * - Vue Router
 * - Auth session restoration
 * - Section preloading
 * - Global error handling
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createI18n } from 'vue-i18n';
import App from './App.vue';
import router from './router/index.js';
import { log } from './utils/common/logHandler.js';
import PerfTracker from './utils/common/performanceTracker.js';
import { resolveActiveLocale } from './utils/translation/localeManager.js';
import { useAuthStore } from './stores/useAuthStore.js';
import { preloadSection } from './utils/section/sectionPreloader.js';
import buildConfig from '../build/buildConfig.js';
import { validateOnStartup, printEnvSummary } from './utils/build/envValidator.js';
import { resolveRouteFromPath } from './utils/route/routeResolver.js';
import { getPreloadSectionsForRoute } from './utils/section/sectionResolver.js';

// Import base styles
import './assets/main.css';

// =================================================================
// GLOBAL PERFORMANCE TRACKER - INITIALIZE FIRST
// =================================================================
// Create global performance tracker instance (initialized once as first global)
// This MUST be the first thing initialized before any other imports or logic
if (typeof window !== 'undefined') {
  window.performanceTracker = new PerfTracker('VueApp-SectionBased', {
    enabled: import.meta.env.VITE_ENABLE_PERFORMANCE_TRACKING === 'true'
  });
  window.performanceTracker.start();
  
  // Also expose as global variable for convenience
  // This allows both window.performanceTracker and performanceTracker references
  globalThis.performanceTracker = window.performanceTracker;
}

// Initialize performance tracker
log('main.js', 'init', 'start', 'Initializing application', {});

// Validate environment variables before proceeding
// This ensures all required env vars are present and valid
try {
  const envValidation = validateOnStartup();

  // Print summary in development mode
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOGGER === 'true') {
    printEnvSummary(import.meta.env.MODE || 'development');
  }

  // Log validation results
  console.log('✅ Environment validation passed:', {
    environment: envValidation.environment,
    valid: envValidation.valid,
    errorCount: envValidation.errors.length,
    warningCount: envValidation.warnings.length
  });
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  console.error('Please check your .env file and ensure all required variables are set.');
  console.error('See .env.example for reference.');
  // Don't throw - allow app to continue with warnings in dev mode
  if (!import.meta.env.DEV) {
    throw error; // But do throw in production
  }
}

if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'appInit_start',
    file: 'main.js',
    method: 'main',
    flag: 'init',
    purpose: 'Initialize Vue application'
  });
}

// Create Vue app instance
const app = createApp(App);

// Create and configure Pinia store
if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'initPinia_start',
    file: 'main.js',
    method: 'main',
    flag: 'store',
    purpose: 'Initialize Pinia store'
  });
}

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

log('main.js', 'init', 'pinia', 'Pinia initialized with persistence', {});

if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'initPinia_complete',
    file: 'main.js',
    method: 'main',
    flag: 'store',
    purpose: 'Pinia store ready'
  });
}

// Create and configure Vue I18n
if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'initI18n_start',
    file: 'main.js',
    method: 'main',
    flag: 'i18n',
    purpose: 'Initialize Vue I18n'
  });
}

// Resolve active locale
const activeLocale = resolveActiveLocale();

log('main.js', 'init', 'locale', 'Locale resolved', { locale: activeLocale });

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: activeLocale,
  fallbackLocale: 'en',
  messages: {
    // Messages will be loaded lazily per section
    en: {},
    vi: {}
  }
});

app.use(i18n);

log('main.js', 'init', 'i18n', 'Vue I18n initialized', { locale: activeLocale });

if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'initI18n_complete',
    file: 'main.js',
    method: 'main',
    flag: 'i18n',
    purpose: 'I18n ready'
  });
}

// Configure router
if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'initRouter_start',
    file: 'main.js',
    method: 'main',
    flag: 'router',
    purpose: 'Initialize Vue Router'
  });
}

app.use(router);

log('main.js', 'init', 'router', 'Vue Router initialized', {});

if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'initRouter_complete',
    file: 'main.js',
    method: 'main',
    flag: 'router',
    purpose: 'Router ready'
  });
}

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  log('main.js', 'errorHandler', 'error', 'Global error caught', {
    error: err.message,
    info,
    stack: err.stack
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'globalError',
      file: 'main.js',
      method: 'errorHandler',
      flag: 'error',
      purpose: `Error: ${err.message}`
    });
  }

  // Always log to console (even in production for debug purposes)
  console.error('[Vue Error]', err);
};

// Global warning handler
app.config.warnHandler = (msg, instance, trace) => {
  log('main.js', 'warnHandler', 'warn', 'Vue warning', { message: msg, trace });
  
  if (import.meta.env.DEV) {
    console.warn('[Vue Warning]', msg);
  }
};

// Restore auth session before mount
if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'restoreSession_start',
    file: 'main.js',
    method: 'main',
    flag: 'auth',
    purpose: 'Restore user session'
  });
}

log('main.js', 'init', 'auth', 'Restoring user session', {});

// Get auth store and restore from persisted storage
const authStore = useAuthStore();
authStore.refreshFromStorage();

if (authStore.isAuthenticated) {
  log('main.js', 'init', 'auth-success', 'Session restored successfully', { 
    email: authStore.currentUser?.email,
    role: authStore.currentUser?.role
  });
  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'restoreSession_success',
      file: 'main.js',
      method: 'main',
      flag: 'auth',
      purpose: 'User session restored'
    });
  }
} else {
  log('main.js', 'init', 'auth-none', 'No session to restore', {});
  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'restoreSession_none',
      file: 'main.js',
      method: 'main',
      flag: 'auth',
      purpose: 'No existing session'
    });
  }
}

// Preload sections based on current route (non-blocking)
if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'preloadSections_start',
    file: 'main.js',
    method: 'main',
    flag: 'preload',
    purpose: 'Preload sections for current route'
  });
}

router.isReady().then(() => {
  // Preload auth section by default (non-blocking)
  log('main.js', 'init', 'preload-default', 'Preloading default auth section', { section: 'auth' });
  preloadSection('auth').catch(err => {
    log('main.js', 'init', 'preload-error', 'Default auth section preload failed (non-blocking)', { 
      section: 'auth',
      error: err.message 
    });
  });

  const currentPath = router.currentRoute.value.path;
  const currentRoute = resolveRouteFromPath(currentPath);
  
  if (currentRoute) {
    const sectionsToPreload = Array.isArray(currentRoute.preLoadSections) 
      ? [...currentRoute.preLoadSections] 
      : [];
    
    log('main.js', 'init', 'preload', 'Preloading sections for current route', { 
      path: currentPath,
      sections: sectionsToPreload,
      routeConfigSlug: currentRoute.slug
    });
    
    if (sectionsToPreload.length > 0) {
      Promise.all(
        sectionsToPreload.map(section => {
          if (section && typeof section === 'string') {
            return preloadSection(section).catch(err => {
              log('main.js', 'init', 'preload-error', 'Section preload failed (non-blocking)', { 
                section, 
                error: err.message 
              });
            });
          } else {
            log('main.js', 'init', 'preload-skip', 'Skipping invalid section name', {
              section,
              type: typeof section
            });
            return Promise.resolve();
          }
        })
      ).then(() => {
        log('main.js', 'init', 'preload-complete', 'Route sections preloaded', { 
          path: currentPath,
          count: sectionsToPreload.length 
        });
        if (window.performanceTracker) {
          window.performanceTracker.step({
            step: 'preloadSections_complete',
            file: 'main.js',
            method: 'main',
            flag: 'preload',
            purpose: `Preloaded ${sectionsToPreload.length} sections for ${currentPath}`
          });
        }
      });
    } else {
      log('main.js', 'init', 'preload-skip', 'No sections to preload for current route', { 
        path: currentPath,
        hasPreLoadSections: !!currentRoute.preLoadSections,
        preLoadSectionsValue: currentRoute.preLoadSections
      });
    }
  } else {
    log('main.js', 'init', 'preload-skip', 'No route config found for current path, skipping preload', { 
      path: currentPath 
    });
  }
}).catch(err => {
  log('main.js', 'init', 'preload-error', 'Error waiting for router ready', { 
    error: err.message 
  });
});

// Mount application
if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'mountApp_start',
    file: 'main.js',
    method: 'main',
    flag: 'mount',
    purpose: 'Mount Vue application to DOM'
  });
}

app.mount('#app');

log('main.js', 'init', 'mount', 'Application mounted successfully', {});

if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'mountApp_complete',
    file: 'main.js',
    method: 'main',
    flag: 'mount',
    purpose: 'Application mounted'
  });
}

// Track app ready
if (window.performanceTracker) {
  window.performanceTracker.step({
    step: 'appReady',
    file: 'main.js',
    method: 'main',
    flag: 'ready',
    purpose: 'Application initialization complete'
  });
}

// Log initialization summary
log('main.js', 'init', 'complete', 'Application initialization complete', {
  locale: activeLocale,
  isAuthenticated: authStore.isAuthenticated,
  currentPath: router.currentRoute.value.path
});

// Print performance table if logging enabled
if (import.meta.env.VITE_ENABLE_LOGGER === 'true' && window.performanceTracker) {
  console.table(window.performanceTracker.table());
}

/**
 * Vue Router Configuration
 * 
 * Dynamically generates routes from routeConfig.json.
 * Applies guards using route utilities.
 * Tracks all navigation with performance tracker.
 */

import { createRouter, createWebHistory } from 'vue-router';
import {
  getRouteConfiguration,
  runAllRouteGuards,
  setCurrentActiveRoute,
  resolveComponentPathForRoute
} from '../utils/route/index.js';
import { log } from '../utils/common/logHandler.js';
import { logError } from '../utils/common/errorHandler.js';
import { useAuthStore } from '../stores/useAuthStore.js';
import { preloadSection } from '../utils/section/sectionPreloader.js';
import { loadTranslationsForSection } from '../utils/translation/translationLoader.js';

/**
 * Generate Vue Router routes from route configuration
 * 
 * @returns {Array} - Array of Vue Router route objects
 */
function generateRoutesFromConfig() {
  log('router/index.js', 'generateRoutesFromConfig', 'start', 'Generating routes from configuration', {});

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'generateRoutes_start',
      file: 'router/index.js',
      method: 'generateRoutesFromConfig',
      flag: 'router-init',
      purpose: 'Generate routes from configuration'
    });
  }

  // Get route configuration
  const routeConfig = getRouteConfiguration();

  const routes = [];

  // Generate route for each configuration entry
  for (const route of routeConfig) {
    // Handle redirects
    if (route.redirect) {
      routes.push({
        path: route.slug,
        redirect: route.redirect
      });
      log('router/index.js', 'generateRoutesFromConfig', 'redirect', 'Added redirect route', { 
        from: route.slug, 
        to: route.redirect 
      });
      continue;
    }

    // Handle regular routes
    const vueRoute = {
      path: route.slug,
      name: route.slug,
      // Component will be loaded dynamically
      component: () => loadRouteComponent(route),
      meta: {
        routeConfig: route,
        section: route.section,
        requiresAuth: route.requiresAuth || false,
        enabled: route.enabled !== false
      }
    };

    routes.push(vueRoute);
    log('router/index.js', 'generateRoutesFromConfig', 'add-route', 'Added route', { 
      path: route.slug, 
      section: route.section 
    });
  }

  log('router/index.js', 'generateRoutesFromConfig', 'success', 'Routes generated from config', {
    routeCount: routes.length
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'generateRoutes_complete',
      file: 'router/index.js',
      method: 'generateRoutesFromConfig',
      flag: 'router-ready',
      purpose: `${routes.length} routes generated`
    });
  }

  return routes;
}

/**
 * Load component for a route
 * Dynamically imports component based on path (with role-based resolution)
 * 
 * @param {object} route - Route configuration object
 * @returns {Promise} - Component promise
 */
async function loadRouteComponent(route) {
  log('router/index.js', 'loadRouteComponent', 'start', 'Loading component for route', { slug: route.slug });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'loadComponent_start',
      file: 'router/index.js',
      method: 'loadRouteComponent',
      flag: 'component-load',
      purpose: `Load component for ${route.slug}`
    });
  }

  try {
    // Get auth store for role-based resolution
    const authStore = useAuthStore();
    const userRole = authStore.currentUser?.role || 'guest';

    // Resolve component path (handles role-based customComponentPath)
    const componentPath = resolveComponentPathForRoute(route, userRole);
    
    if (!componentPath) {
      throw new Error(`No component path found for route: ${route.slug}`);
    }
    
    log('router/index.js', 'loadRouteComponent', 'resolve', 'Component path resolved', { 
      slug: route.slug, 
      userRole, 
      componentPath 
    });

    // Convert @/ alias to relative path
    // The browser can't resolve @/ alias at runtime - it needs actual paths
    // From src/router/ to src/templates/ or src/components/ is one level up: ../
    let importPath = componentPath;
    if (componentPath.startsWith('@/')) {
      // Remove @/ and convert to relative path from router directory
      // @/templates/auth/... becomes ../templates/auth/...
      // @/components/misc/... becomes ../components/misc/...
      const pathWithoutAlias = componentPath.substring(2); // Remove '@/'
      importPath = `../${pathWithoutAlias}`;
    }

    // Dynamically import component
    // We use @vite-ignore because paths are dynamic
    // The browser will resolve the relative path
    const componentModule = await import(/* @vite-ignore */ importPath);

    log('router/index.js', 'loadRouteComponent', 'success', 'Component loaded successfully', {
      slug: route.slug,
      path: componentPath,
      importPath
    });

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'loadComponent_complete',
        file: 'router/index.js',
        method: 'loadRouteComponent',
        flag: 'component-success',
        purpose: `Component loaded for ${route.slug}`
      });
    }

    log('router/index.js', 'loadRouteComponent', 'return', 'Returning loaded component', { slug: route.slug, componentType: typeof componentModule.default });
    return componentModule.default || componentModule;
  } catch (error) {
    log('router/index.js', 'loadRouteComponent', 'error', 'Failed to load component, using fallback', {
      slug: route.slug,
      error: error.message,
      stack: error.stack,
      componentPath: route.componentPath
    });

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'loadComponent_fallback',
        file: 'router/index.js',
        method: 'loadRouteComponent',
        flag: 'component-error',
        purpose: `Component load failed, using NotFound fallback`
      });
    }

    log('router/index.js', 'loadRouteComponent', 'return', 'Returning NotFound fallback component', { slug: route.slug, fallbackPath: '../components/misc/NotFound.vue' });
    // Fallback to NotFound component
    return import('../components/misc/NotFound.vue');
  }
}

// Generate routes from configuration
const routes = generateRoutesFromConfig();

// Create router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

/**
 * Before each route navigation
 * Runs guards and tracks navigation
 */
router.beforeEach(async (to, from, next) => {
  log('router/index.js', 'beforeEach', 'start', 'Navigation started', {
    from: from.path,
    to: to.path
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'navigationStart',
      file: 'router/index.js',
      method: 'beforeEach',
      flag: 'nav-start',
      purpose: `Navigate from ${from.path} to ${to.path}`
    });
  }

  // Get route configuration from meta
  const routeConfig = to.meta?.routeConfig;

  if (!routeConfig) {
    log('router/index.js', 'beforeEach', 'no-config', 'No route configuration found in meta, allowing navigation', { path: to.path });
    next();
    return;
  }

  // Get auth context from auth store
  const authStore = useAuthStore();
  const guardContext = {
    isAuthenticated: authStore.isAuthenticated,
    userRole: authStore.currentUser?.role || 'guest',
    userProfile: authStore.currentUser || {}
  };

  log('router/index.js', 'beforeEach', 'auth-context', 'Auth context prepared', guardContext);

  // Run all route guards (AWAIT the async call)
  const guardResult = await runAllRouteGuards(routeConfig, from.meta?.routeConfig, guardContext);

  // Handle guard result
  if (guardResult.allow) {
    log('router/index.js', 'beforeEach', 'allow', 'Navigation allowed by guards', { to: to.path });
    
    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'navigationAllowed',
        file: 'router/index.js',
        method: 'beforeEach',
        flag: 'nav-allow',
        purpose: `Navigation to ${to.path} allowed`
      });
    }

    next();
  } else {
    log('router/index.js', 'beforeEach', 'block', 'Navigation blocked by guards', {
      to: to.path,
      reason: guardResult.reason,
      redirectTo: guardResult.redirectTo
    });

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'navigationBlocked',
        file: 'router/index.js',
        method: 'beforeEach',
        flag: 'nav-block',
        purpose: `Navigation blocked: ${guardResult.reason}`
      });
    }

    if (guardResult.redirectTo) {
      next(guardResult.redirectTo);
    } else {
      next(false);
    }
  }
});

/**
 * After each route navigation
 * Update active route, preload section, load translations, track completion
 */
router.afterEach(async (to, from) => {
  log('router/index.js', 'afterEach', 'start', 'Navigation completed', {
    from: from.path,
    to: to.path
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'navigationComplete',
      file: 'router/index.js',
      method: 'afterEach',
      flag: 'nav-complete',
      purpose: `Navigation to ${to.path} completed`
    });
  }

  // Update active route in navigation tracker
  if (to.meta?.routeConfig) {
    setCurrentActiveRoute(to.meta.routeConfig);
  }

  // Get section from route meta
  const section = to.meta?.section;
  const routeConfig = to.meta?.routeConfig;

  // Check if route should be excluded from preloading
  const preloadExclude = routeConfig?.preloadExclude === true;

  if (preloadExclude) {
    log('router/index.js', 'afterEach', 'preload-excluded', 'Route excluded from preloading', {
      path: to.path,
      section,
      preloadExclude
    });
  }

  if (section && !preloadExclude) {
    log('router/index.js', 'afterEach', 'section', 'Route has section, preloading and loading translations', { section });

    try {
      // Preload section assets (non-blocking)
      preloadSection(section).catch(err => {
        log('router/index.js', 'afterEach', 'preload-error', 'Section preload failed (non-blocking)', {
          section,
          error: err.message
        });
      });

      // Load translations for section (non-blocking)
      loadTranslationsForSection(section).catch(err => {
        log('router/index.js', 'afterEach', 'translation-error', 'Translation load failed (non-blocking)', { 
          section, 
          error: err.message 
        });
      });

      log('router/index.js', 'afterEach', 'success', 'Section preload and translation load initiated', { section });
    } catch (error) {
      log('router/index.js', 'afterEach', 'error', 'Error during post-navigation tasks', { 
        error: error.message, 
        stack: error.stack 
      });
    }
  } else {
    log('router/index.js', 'afterEach', 'no-section', 'Route has no section defined', { path: to.path });
  }
});

/**
 * Handle navigation errors
 */
router.onError((error) => {
  log('router/index.js', 'onError', 'error', 'Navigation error occurred', {
    error: error.message,
    stack: error.stack
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'navigationError',
      file: 'router/index.js',
      method: 'onError',
      flag: 'nav-error',
      purpose: `Navigation error: ${error.message}`
    });
  }
});

export default router;
export { runAllRouteGuards };

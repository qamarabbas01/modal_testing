/**
 * RouteGuards - Navigation guard implementations
 * 
 * **CRITICAL**: Every guard operation tracked with global window.performanceTracker.
 * Guards determine if navigation should proceed, redirect, or abort.
 * 
 * Guard execution order:
 * 1. Loop prevention
 * 2. Enabled check
 * 3. Authentication check
 * 4. Role check
 * 5. Dependency check
 */

import { log } from '../common/logHandler.js';
import { safelyGetNestedProperty } from '../common/objectSafety.js';

// Navigation history for loop detection
const navigationHistory = [];
const MAX_NAVIGATION_HISTORY = 50;

/**
 * Run all route guards in sequence
 * **CRITICAL**: Wraps entire guard chain with perfTracker
 * 
 * @param {object} toRoute - Target route object
 * @param {object} fromRoute - Current route object
 * @param {object} context - Additional context (user, auth state, etc.)
 * @returns {object} - Guard result { allow: boolean, redirectTo: string|null, reason: string }
 */
export async function runAllRouteGuards(toRoute, fromRoute, context = {}) {
  log('routeGuards.js', 'runAllRouteGuards', 'start', 'Starting guard chain', {
    toPath: toRoute?.slug,
    fromPath: fromRoute?.slug
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'guardChainStart',
      file: 'routeGuards.js',
      method: 'runAllRouteGuards',
      flag: 'guard-start',
      purpose: `Begin guard chain for ${toRoute?.slug}`
    });
  }

  try {
    // Execute guards in order
    
    // 1. Check for navigation loops
    const loopGuard = guardPreventNavigationLoop(toRoute, fromRoute);
    if (!loopGuard.allow) {
      log('routeGuards.js', 'runAllRouteGuards', 'block', 'Navigation blocked by loop guard', loopGuard);
      return loopGuard;
    }

    // 2. Check if route is enabled
    const enabledGuard = guardCheckRouteEnabled(toRoute);
    if (!enabledGuard.allow) {
      log('routeGuards.js', 'runAllRouteGuards', 'block', 'Navigation blocked by enabled guard', enabledGuard);
      return enabledGuard;
    }

    // 3. Check authentication requirements
    const authGuard = guardCheckAuthentication(toRoute, context);
    if (!authGuard.allow) {
      log('routeGuards.js', 'runAllRouteGuards', 'block', 'Navigation blocked by auth guard', authGuard);
      return authGuard;
    }

    // 4. Check role requirements
    const roleGuard = guardCheckUserRole(toRoute, context);
    if (!roleGuard.allow) {
      log('routeGuards.js', 'runAllRouteGuards', 'block', 'Navigation blocked by role guard', roleGuard);
      return roleGuard;
    }

    // 5. Check dependencies (onboarding, KYC, etc.)
    const dependencyGuard = guardCheckDependencies(toRoute, context);
    if (!dependencyGuard.allow) {
      log('routeGuards.js', 'runAllRouteGuards', 'block', 'Navigation blocked by dependency guard', dependencyGuard);
      return dependencyGuard;
    }

    // All guards passed
    const guardResult = { allow: true, redirectTo: null, reason: 'All guards passed' };

    // Track guard chain completion
    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'guardChainComplete',
        file: 'routeGuards.js',
        method: 'runAllRouteGuards',
        flag: 'guard-complete',
        purpose: `Guard chain result: ALLOW`
      });
    }

    log('routeGuards.js', 'runAllRouteGuards', 'return', 'Guard chain completed, navigation allowed', guardResult);
    return guardResult;

  } catch (error) {
    log('routeGuards.js', 'runAllRouteGuards', 'error', 'Guard chain execution failed', { 
      error: error.message, 
      stack: error.stack 
    });

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'guardChainError',
        file: 'routeGuards.js',
        method: 'runAllRouteGuards',
        flag: 'error',
        purpose: 'Guard chain failed with exception'
      });
    }

    log('routeGuards.js', 'runAllRouteGuards', 'return', 'Returning fallback 404 redirect', { error: error.message });
    return { allow: false, redirectTo: '/404', reason: 'Guard execution failed' };
  }
}

/**
 * Prevent navigation loops
 * Detects if user is being redirected in circles
 * 
 * @param {object} toRoute - Target route
 * @param {object} fromRoute - Current route
 * @returns {object} - Guard result
 */
export function guardPreventNavigationLoop(toRoute, fromRoute) {
  log('routeGuards.js', 'guardPreventNavigationLoop', 'start', 'Checking for navigation loops', {
    toPath: toRoute?.slug,
    fromPath: fromRoute?.slug
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'guardLoopCheck',
      file: 'routeGuards.js',
      method: 'guardPreventNavigationLoop',
      flag: 'loop-detection',
      purpose: 'Check for navigation loops'
    });
  }

  // Add to history
  navigationHistory.push({
    path: toRoute?.slug,
    timestamp: Date.now()
  });

  // Trim history to max size
  if (navigationHistory.length > MAX_NAVIGATION_HISTORY) {
    navigationHistory.shift();
  }

  // Check for repeated navigation to same path
  const recentNavigations = navigationHistory.slice(-5);
  const repeatedPath = recentNavigations.filter(nav => nav.path === toRoute?.slug);

  if (repeatedPath.length >= 3) {
    log('routeGuards.js', 'guardPreventNavigationLoop', 'warn', 'Navigation loop detected', {
      path: toRoute?.slug,
      count: repeatedPath.length
    });

    if (window.performanceTracker) {
      window.performanceTracker.step({
        step: 'loopDetected',
        file: 'routeGuards.js',
        method: 'guardPreventNavigationLoop',
        flag: 'loop-found',
        purpose: `Loop detected for path: ${toRoute?.slug}`
      });
    }

    const result = {
      allow: false,
      redirectTo: '/404',
      reason: 'Navigation loop detected'
    };
    
    log('routeGuards.js', 'guardPreventNavigationLoop', 'return', 'Returning loop block result', result);
    return result;
  }

  // No loop detected
  const result = { allow: true, redirectTo: null, reason: 'No loop detected' };
  log('routeGuards.js', 'guardPreventNavigationLoop', 'return', 'No loop detected', result);
  return result;
}

/**
 * Check if route is enabled
 * Disabled routes should return 404
 * 
 * @param {object} route - Route to check
 * @returns {object} - Guard result
 */
export function guardCheckRouteEnabled(route) {
  log('routeGuards.js', 'guardCheckRouteEnabled', 'start', 'Checking if route is enabled', {
    slug: route?.slug,
    enabled: route?.enabled
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'guardEnabledCheck',
      file: 'routeGuards.js',
      method: 'guardCheckRouteEnabled',
      flag: 'enabled-check',
      purpose: 'Check if route is enabled'
    });
  }

  // Routes are enabled by default
  if (route.enabled === false) {
    log('routeGuards.js', 'guardCheckRouteEnabled', 'warn', 'Route is disabled', { slug: route.slug });

    const result = {
      allow: false,
      redirectTo: '/404',
      reason: 'Route is disabled'
    };
    
    log('routeGuards.js', 'guardCheckRouteEnabled', 'return', 'Returning disabled route block', result);
    return result;
  }

  const result = { allow: true, redirectTo: null, reason: 'Route is enabled' };
  log('routeGuards.js', 'guardCheckRouteEnabled', 'return', 'Route is enabled', result);
  return result;
}

/**
 * Check authentication requirements
 * Verifies if user is authenticated when route requires it
 * 
 * @param {object} route - Route to check
 * @param {object} context - Context with user and auth state
 * @returns {object} - Guard result
 */
export function guardCheckAuthentication(route, context) {
  log('routeGuards.js', 'guardCheckAuthentication', 'start', 'Checking authentication requirements', {
    slug: route?.slug,
    requiresAuth: route?.requiresAuth,
    isAuthenticated: context?.isAuthenticated
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'guardAuthCheck',
      file: 'routeGuards.js',
      method: 'guardCheckAuthentication',
      flag: 'auth-check',
      purpose: 'Check authentication requirements'
    });
  }

  // Check if route requires authentication
  if (route.requiresAuth === true) {
    // User must be authenticated
    if (!context.isAuthenticated) {
      log('routeGuards.js', 'guardCheckAuthentication', 'warn', 'Authentication required but user not authenticated', {
        slug: route.slug
      });

      // Redirect to login or specified path
      const redirectPath = route.redirectIfNotAuth || '/log-in';

      const result = {
        allow: false,
        redirectTo: redirectPath,
        reason: 'Authentication required'
      };
      
      log('routeGuards.js', 'guardCheckAuthentication', 'return', 'Returning auth required block', result);
      return result;
    }
  }

  // Check if authenticated users should be redirected away (e.g., login page)
  if (route.redirectIfLoggedIn && context.isAuthenticated) {
    log('routeGuards.js', 'guardCheckAuthentication', 'info', 'Authenticated user accessing login page, redirecting', {
      slug: route.slug,
      redirectTo: route.redirectIfLoggedIn
    });

    const result = {
      allow: false,
      redirectTo: route.redirectIfLoggedIn,
      reason: 'Already authenticated'
    };
    
    log('routeGuards.js', 'guardCheckAuthentication', 'return', 'Returning already authenticated redirect', result);
    return result;
  }

  const result = { allow: true, redirectTo: null, reason: 'Authentication check passed' };
  log('routeGuards.js', 'guardCheckAuthentication', 'return', 'Authentication check passed', result);
  return result;
}

/**
 * Check user role requirements
 * Verifies if user's role is allowed to access route
 * 
 * @param {object} route - Route to check
 * @param {object} context - Context with user role
 * @returns {object} - Guard result
 */
export function guardCheckUserRole(route, context) {
  log('routeGuards.js', 'guardCheckUserRole', 'start', 'Checking user role requirements', {
    slug: route?.slug,
    supportedRoles: route?.supportedRoles,
    userRole: context?.userRole
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'guardRoleCheck',
      file: 'routeGuards.js',
      method: 'guardCheckUserRole',
      flag: 'role-check',
      purpose: 'Check user role permissions'
    });
  }

  // If no role requirements, allow access
  if (!route.supportedRoles || route.supportedRoles.length === 0) {
    const result = { allow: true, redirectTo: null, reason: 'No role restrictions' };
    log('routeGuards.js', 'guardCheckUserRole', 'return', 'No role restrictions', result);
    return result;
  }

  // Check for "all" roles
  if (route.supportedRoles.includes('all') || route.supportedRoles.includes('any')) {
    const result = { allow: true, redirectTo: null, reason: 'Route allows all roles' };
    log('routeGuards.js', 'guardCheckUserRole', 'return', 'Route allows all roles', result);
    return result;
  }

  // Check if user role is in supported roles
  const userRole = context.userRole || 'guest';
  
  if (!route.supportedRoles.includes(userRole)) {
    log('routeGuards.js', 'guardCheckUserRole', 'warn', 'User role not authorized for route', {
      slug: route.slug,
      userRole,
      supportedRoles: route.supportedRoles
    });

    const result = {
      allow: false,
      redirectTo: '/404',
      reason: `Role ${userRole} not authorized`
    };
    
    log('routeGuards.js', 'guardCheckUserRole', 'return', 'Returning role not authorized block', result);
    return result;
  }

  const result = { allow: true, redirectTo: null, reason: 'Role check passed' };
  log('routeGuards.js', 'guardCheckUserRole', 'return', 'Role check passed', result);
  return result;
}

/**
 * Check route dependencies (onboarding, KYC, etc.)
 * Verifies user has completed required steps
 * 
 * @param {object} route - Route to check
 * @param {object} context - Context with user profile
 * @returns {object} - Guard result
 */
export function guardCheckDependencies(route, context) {
  log('routeGuards.js', 'guardCheckDependencies', 'start', 'Checking route dependencies', {
    slug: route?.slug,
    hasDependencies: !!route?.dependencies
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'guardDependencyCheck',
      file: 'routeGuards.js',
      method: 'guardCheckDependencies',
      flag: 'dependency-check',
      purpose: 'Check route dependencies'
    });
  }

  // If no dependencies, allow access
  if (!route.dependencies) {
    const result = { allow: true, redirectTo: null, reason: 'No dependencies' };
    log('routeGuards.js', 'guardCheckDependencies', 'return', 'No dependencies', result);
    return result;
  }

  const userRole = context.userRole || 'guest';
  const userProfile = context.userProfile || {};

  // Check role-specific dependencies
  const roleDependencies = safelyGetNestedProperty(route.dependencies, `roles.${userRole}`);

  if (roleDependencies) {
    // Check each dependency
    for (const [depKey, depConfig] of Object.entries(roleDependencies)) {
      const isRequired = depConfig.required === true;
      const fallbackSlug = depConfig.fallbackSlug;

      // Check if user meets this dependency
      const userHasDependency = userProfile[depKey] === true;

      if (isRequired && !userHasDependency) {
        log('routeGuards.js', 'guardCheckDependencies', 'warn', 'User missing required dependency', {
          slug: route.slug,
          dependency: depKey,
          fallbackSlug
        });

        const result = {
          allow: false,
          redirectTo: fallbackSlug || '/dashboard',
          reason: `Missing required dependency: ${depKey}`
        };
        
        log('routeGuards.js', 'guardCheckDependencies', 'return', 'Returning missing dependency block', result);
        return result;
      }
    }
  }

  // Check general dependencies (not role-specific)
  if (route.dependencies.onboardingRequired) {
    const onboardingComplete = userProfile.onboardingPassed === true;

    if (!onboardingComplete) {
      const fallbackSlug = safelyGetNestedProperty(
        route.dependencies,
        'onboardingRequired.fallbackSlug',
        '/sign-up/onboarding'
      );

      log('routeGuards.js', 'guardCheckDependencies', 'warn', 'Onboarding required but not completed', {
        slug: route.slug,
        fallbackSlug
      });

      const result = {
        allow: false,
        redirectTo: fallbackSlug,
        reason: 'Onboarding not completed'
      };
      
      log('routeGuards.js', 'guardCheckDependencies', 'return', 'Returning onboarding required block', result);
      return result;
    }
  }

  const result = { allow: true, redirectTo: null, reason: 'All dependencies met' };
  log('routeGuards.js', 'guardCheckDependencies', 'return', 'All dependencies met', result);
  return result;
}

/**
 * Clear navigation history
 * Useful for testing or after logout
 * 
 * @returns {void}
 */
export function clearNavigationHistory() {
  log('routeGuards.js', 'clearNavigationHistory', 'info', 'Navigation history cleared', { previousLength: navigationHistory.length });
  navigationHistory.length = 0;
  log('routeGuards.js', 'clearNavigationHistory', 'return', 'History cleared', { newLength: 0 });
}

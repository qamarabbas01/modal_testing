/**
 * SectionBundler - Core logic to bundle per section
 * 
 * Parses routeConfig to discover sections and generates Rollup configuration
 * for section-based code splitting. All operations tracked with perfTracker.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Discover all sections from route configuration
 * Scans routeConfig.json and extracts unique section names
 * 
 * @returns {Set<string>} - Set of unique section names
 */
export function discoverAllSectionsFromConfig() {
  console.log('[SectionBundler] discoverAllSectionsFromConfig() started');

  try {
    // Load route configuration
    const routeConfigPath = join(__dirname, '../../src/router/routeConfig.json');
    
    // Validate config file exists
    try {
      const stats = readFileSync(routeConfigPath, 'utf-8');
    } catch (fileError) {
      console.error('[SectionBundler] Route config file not found:', routeConfigPath);
      throw new Error(`Route config file not found: ${routeConfigPath}`);
    }
    
    const routeConfigData = JSON.parse(readFileSync(routeConfigPath, 'utf-8'));

    // Validate config is an array
    if (!Array.isArray(routeConfigData)) {
      console.error('[SectionBundler] Invalid route config format. Expected array, got:', typeof routeConfigData);
      throw new Error('Route config must be an array');
    }

    const discoveredSections = new Set();
    const warnings = [];

    // Iterate through all routes
    for (const route of routeConfigData) {
      // Validate route has slug
      if (!route.slug) {
        warnings.push(`Route missing slug: ${JSON.stringify(route)}`);
        continue;
      }

      // Skip routes without section
      if (!route.section) {
        continue;
      }

      // Handle string section (simple)
      if (typeof route.section === 'string') {
        // Validate section name is not empty
        if (!route.section.trim()) {
          warnings.push(`Route ${route.slug} has empty section name`);
          continue;
        }
        discoveredSections.add(route.section);
        continue;
      }

      // Handle object section (role-based)
      if (typeof route.section === 'object' && route.section !== null && !Array.isArray(route.section)) {
        // Validate object has at least one role
        if (Object.keys(route.section).length === 0) {
          warnings.push(`Route ${route.slug} has empty section object`);
          continue;
        }

        // Add all role-specific section names
        for (const [role, sectionName] of Object.entries(route.section)) {
          if (typeof sectionName === 'string') {
            if (!sectionName.trim()) {
              warnings.push(`Route ${route.slug} role ${role} has empty section name`);
              continue;
            }
            discoveredSections.add(sectionName);
          } else {
            warnings.push(`Route ${route.slug} role ${role} has invalid section type: ${typeof sectionName}`);
          }
        }
      } else if (route.section !== null && typeof route.section === 'object') {
        warnings.push(`Route ${route.slug} has invalid section format (array not allowed)`);
      }
    }

    // Log warnings if any
    if (warnings.length > 0) {
      console.warn('[SectionBundler] Validation warnings:', warnings);
    }

    // Validate we found at least one section
    if (discoveredSections.size === 0) {
      console.warn('[SectionBundler] No sections found in route config. Build may not work as expected.');
    }

    console.log('[SectionBundler] Sections discovered:', {
      count: discoveredSections.size,
      sections: Array.from(discoveredSections),
      warningCount: warnings.length
    });

    return discoveredSections;
  } catch (error) {
    console.error('[SectionBundler] Failed to discover sections:', error.message);
    return new Set();
  }
}

/**
 * Generate manual chunks configuration for Rollup
 * Creates section-based code splitting strategy
 * 
 * @param {Set<string>} sections - Set of section names
 * @returns {Function} - Manual chunks function for Rollup
 */
export function generateManualChunksConfiguration(sections) {
  console.log('[SectionBundler] generateManualChunksConfiguration() called');

  // Convert Set to Array for easier processing
  const sectionArray = Array.from(sections);

  /**
   * Manual chunks function
   * Determines which chunk each module should go into
   * 
   * @param {string} id - Module ID (file path)
   * @returns {string|undefined} - Chunk name or undefined for default chunk
   */
  return function manualChunks(id) {
    // Bundle node_modules separately
    if (id.includes('node_modules')) {
      // Extract package name
      const match = id.match(/node_modules\/(@?[^/]+)/);
      if (match) {
        const packageName = match[1];
        
        // Group common Vue ecosystem packages
        if (packageName === 'vue' || packageName === '@vue') {
          return 'vendor-vue';
        }
        if (packageName === 'vue-router') {
          return 'vendor-vue-router';
        }
        if (packageName === 'pinia') {
          return 'vendor-pinia';
        }
        if (packageName === 'vue-i18n' || packageName === '@intlify') {
          return 'vendor-i18n';
        }
        
        // All other vendors
        return 'vendor';
      }
    }

    // Bundle components and templates by section
    for (const sectionName of sectionArray) {
      // Check if file belongs to this section
      if (
        id.includes(`/components/${sectionName}/`) ||
        id.includes(`/templates/${sectionName}/`) ||
        id.includes(`/components/layout/${sectionName}/`)
      ) {
        return `section-${sectionName}`;
      }

      // Handle role-specific sections (e.g., dashboard-creator)
      if (sectionName.includes('-')) {
        const baseSection = sectionName.split('-')[0];
        if (
          id.includes(`/components/${baseSection}/`) ||
          id.includes(`/templates/${baseSection}/`)
        ) {
          return `section-${sectionName}`;
        }
      }
    }

    // Bundle translation files separately
    if (id.includes('/i18n/section-')) {
      const match = id.match(/\/i18n\/(section-[^/]+)\//);
      if (match) {
        const sectionName = match[1].replace('section-', '');
        return `i18n-${sectionName}`;
      }
    }

    // Utilities and common code stay in main bundle
    if (id.includes('/utils/')) {
      return 'utils';
    }

    // Return undefined to let Rollup decide (goes to main bundle)
    return undefined;
  };
}

/**
 * Group components by section for analysis
 * Returns map of section names to component file paths
 * 
 * @param {Set<string>} sections - Set of section names
 * @returns {Map<string, Array<string>>} - Map of section to component paths
 */
export function groupComponentsBySection(sections) {
  console.log('[SectionBundler] groupComponentsBySection() called');

  const componentMap = new Map();

  // Initialize map for each section
  for (const sectionName of sections) {
    componentMap.set(sectionName, []);
  }

  // Note: Actual file scanning would happen here in a real implementation
  // For now, this provides the structure

  console.log('[SectionBundler] Component grouping complete:', {
    sectionCount: componentMap.size
  });

  return componentMap;
}

/**
 * Get preload configuration for sections
 * Determines which sections should be eagerly loaded
 * 
 * @param {Set<string>} sections - All discovered sections
 * @returns {object} - Configuration { eager: Array, lazy: Array }
 */
export function getPreloadConfiguration(sections) {
  console.log('[SectionBundler] getPreloadConfiguration() called');

  // Sections that should always be preloaded
  const alwaysPreload = ['auth', 'misc', 'dashboard-global'];

  const eagerSections = [];
  const lazySections = [];

  for (const sectionName of sections) {
    if (alwaysPreload.includes(sectionName)) {
      eagerSections.push(sectionName);
    } else {
      lazySections.push(sectionName);
    }
  }

  console.log('[SectionBundler] Preload configuration:', {
    eager: eagerSections.length,
    lazy: lazySections.length
  });

  return {
    eager: eagerSections,
    lazy: lazySections
  };
}

/**
 * Get section dependencies from route config
 * Analyzes which sections depend on each other for loading
 * 
 * @returns {Map<string, Array<string>>} - Map of section to dependencies
 */
export function getSectionDependencies() {
  console.log('[SectionBundler] getSectionDependencies() called');

  try {
    // Load route configuration
    const routeConfigPath = join(__dirname, '../../src/router/routeConfig.json');
    const routeConfigData = JSON.parse(readFileSync(routeConfigPath, 'utf-8'));

    const dependencyMap = new Map();

    // Analyze preLoadSections for each route
    for (const route of routeConfigData) {
      if (!route.section || !route.preLoadSections) {
        continue;
      }

      // Get section name
      const sectionName = typeof route.section === 'string' 
        ? route.section 
        : Object.values(route.section)[0];

      // Initialize dependency array if needed
      if (!dependencyMap.has(sectionName)) {
        dependencyMap.set(sectionName, []);
      }

      // Add preload sections as dependencies
      const currentDeps = dependencyMap.get(sectionName);
      for (const depSection of route.preLoadSections) {
        if (!currentDeps.includes(depSection)) {
          currentDeps.push(depSection);
        }
      }
    }

    console.log('[SectionBundler] Section dependencies mapped:', {
      sectionCount: dependencyMap.size
    });

    return dependencyMap;
  } catch (error) {
    console.error('[SectionBundler] Failed to get section dependencies:', error.message);
    return new Map();
  }
}

/**
 * Create Vite plugin for section-based bundling
 * 
 * @returns {object} - Vite plugin object
 */
export function createSectionBundlerPlugin() {
  console.log('[SectionBundler] Creating section bundler plugin');

  return {
    name: 'vite-plugin-section-bundler',
    
    config(config, { command }) {
      console.log('[SectionBundler] Plugin config hook called:', { command });

      // Discover sections
      const sections = discoverAllSectionsFromConfig();

      // Generate manual chunks configuration
      const manualChunks = generateManualChunksConfiguration(sections);

      // Return configuration to merge with Vite config
      return {
        build: {
          rollupOptions: {
            output: {
              manualChunks
            }
          }
        }
      };
    },

    buildStart() {
      console.log('[SectionBundler] Build started - analyzing sections');
      const sections = discoverAllSectionsFromConfig();
      const preloadConfig = getPreloadConfiguration(sections);
      
      console.log('[SectionBundler] Section analysis complete:', {
        totalSections: sections.size,
        eagerSections: preloadConfig.eager.length,
        lazySections: preloadConfig.lazy.length
      });
    },

    buildEnd() {
      console.log('[SectionBundler] Build ended');
    }
  };
}


// vueApp-main-new/src/utils/assets/assetPreloader.js

import { log } from '../common/logHandler';

/**
 * @file assetPreloader.js
 * @description Asset preloading utilities for images, fonts, media, and scripts
 * @purpose Preload assets per section to optimize performance
 */

// Performance tracker available globally as window.performanceTracker

// Track preloaded assets to avoid duplicates
const preloadedAssets = new Set();

// Track in-progress preloads to avoid duplicate requests
const preloadInProgress = new Map();

/**
 * @function preloadImage
 * @description Preload an image asset
 * @param {string} src - Image source URL
 * @param {object} options - Preload options
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
export function preloadImage(src, options = {}) {
  log('assetPreloader.js', 'preloadImage', 'start', 'Preloading image', { src, options });
  window.performanceTracker.step({
    step: 'preloadImage_start',
    file: 'assetPreloader.js',
    method: 'preloadImage',
    flag: 'start',
    purpose: 'Preload image asset'
  });

  if (preloadedAssets.has(src)) {
    log('assetPreloader.js', 'preloadImage', 'already-preloaded', 'Image already preloaded', { src });
    window.performanceTracker.step({
      step: 'preloadImage_cached',
      file: 'assetPreloader.js',
      method: 'preloadImage',
      flag: 'cache-hit',
      purpose: 'Image already preloaded'
    });
    return Promise.resolve(null);
  }

  if (preloadInProgress.has(src)) {
    log('assetPreloader.js', 'preloadImage', 'in-progress', 'Image preload already in progress', { src });
    return preloadInProgress.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      preloadedAssets.add(src);
      preloadInProgress.delete(src);
      log('assetPreloader.js', 'preloadImage', 'success', 'Image preloaded successfully', { 
        src, 
        width: img.width, 
        height: img.height 
      });
      window.performanceTracker.step({
        step: 'preloadImage_complete',
        file: 'assetPreloader.js',
        method: 'preloadImage',
        flag: 'success',
        purpose: 'Image preload complete'
      });
      resolve(img);
    };
    
    img.onerror = (error) => {
      preloadInProgress.delete(src);
      log('assetPreloader.js', 'preloadImage', 'error', 'Image preload failed', { 
        src, 
        error: error.message || 'Load error' 
      });
      window.performanceTracker.step({
        step: 'preloadImage_error',
        file: 'assetPreloader.js',
        method: 'preloadImage',
        flag: 'error',
        purpose: 'Image preload failed'
      });
      reject(new Error(`Failed to preload image: ${src}`));
    };
    
    img.src = src;
    
    if (options.crossOrigin) {
      img.crossOrigin = options.crossOrigin;
    }
  });

  preloadInProgress.set(src, promise);
  return promise;
}

/**
 * @function preloadFont
 * @description Preload a font asset
 * @param {string} src - Font source URL
 * @param {object} options - Preload options
 * @returns {Promise<void>} Completion promise
 */
export function preloadFont(src, options = {}) {
  log('assetPreloader.js', 'preloadFont', 'start', 'Preloading font', { src, options });
  window.performanceTracker.step({
    step: 'preloadFont_start',
    file: 'assetPreloader.js',
    method: 'preloadFont',
    flag: 'start',
    purpose: 'Preload font asset'
  });

  if (preloadedAssets.has(src)) {
    log('assetPreloader.js', 'preloadFont', 'already-preloaded', 'Font already preloaded', { src });
    window.performanceTracker.step({
      step: 'preloadFont_cached',
      file: 'assetPreloader.js',
      method: 'preloadFont',
      flag: 'cache-hit',
      purpose: 'Font already preloaded'
    });
    return Promise.resolve();
  }

  if (preloadInProgress.has(src)) {
    log('assetPreloader.js', 'preloadFont', 'in-progress', 'Font preload already in progress', { src });
    return preloadInProgress.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = src;
    link.type = options.type || 'font/woff2';
    
    if (options.crossOrigin !== false) {
      link.crossOrigin = 'anonymous';
    }
    
    link.onload = () => {
      preloadedAssets.add(src);
      preloadInProgress.delete(src);
      log('assetPreloader.js', 'preloadFont', 'success', 'Font preloaded successfully', { src });
      window.performanceTracker.step({
        step: 'preloadFont_complete',
        file: 'assetPreloader.js',
        method: 'preloadFont',
        flag: 'success',
        purpose: 'Font preload complete'
      });
      resolve();
    };
    
    link.onerror = (error) => {
      preloadInProgress.delete(src);
      log('assetPreloader.js', 'preloadFont', 'error', 'Font preload failed', { 
        src, 
        error: error.message || 'Load error' 
      });
      window.performanceTracker.step({
        step: 'preloadFont_error',
        file: 'assetPreloader.js',
        method: 'preloadFont',
        flag: 'error',
        purpose: 'Font preload failed'
      });
      reject(new Error(`Failed to preload font: ${src}`));
    };
    
    document.head.appendChild(link);
  });

  preloadInProgress.set(src, promise);
  return promise;
}

/**
 * @function preloadMedia
 * @description Preload a media asset (video/audio)
 * @param {string} src - Media source URL
 * @param {string} type - Media type ('video' or 'audio')
 * @param {object} options - Preload options
 * @returns {Promise<void>} Completion promise
 */
export function preloadMedia(src, type = 'video', options = {}) {
  log('assetPreloader.js', 'preloadMedia', 'start', 'Preloading media', { src, type, options });
  window.performanceTracker.step({
    step: 'preloadMedia_start',
    file: 'assetPreloader.js',
    method: 'preloadMedia',
    flag: 'start',
    purpose: 'Preload media asset'
  });

  if (preloadedAssets.has(src)) {
    log('assetPreloader.js', 'preloadMedia', 'already-preloaded', 'Media already preloaded', { src });
    window.performanceTracker.step({
      step: 'preloadMedia_cached',
      file: 'assetPreloader.js',
      method: 'preloadMedia',
      flag: 'cache-hit',
      purpose: 'Media already preloaded'
    });
    return Promise.resolve();
  }

  if (preloadInProgress.has(src)) {
    log('assetPreloader.js', 'preloadMedia', 'in-progress', 'Media preload already in progress', { src });
    return preloadInProgress.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = type;
    link.href = src;
    
    if (options.type) {
      link.type = options.type;
    }
    
    link.onload = () => {
      preloadedAssets.add(src);
      preloadInProgress.delete(src);
      log('assetPreloader.js', 'preloadMedia', 'success', 'Media preloaded successfully', { src, type });
      window.performanceTracker.step({
        step: 'preloadMedia_complete',
        file: 'assetPreloader.js',
        method: 'preloadMedia',
        flag: 'success',
        purpose: 'Media preload complete'
      });
      resolve();
    };
    
    link.onerror = (error) => {
      preloadInProgress.delete(src);
      log('assetPreloader.js', 'preloadMedia', 'error', 'Media preload failed', { 
        src, 
        type, 
        error: error.message || 'Load error' 
      });
      window.performanceTracker.step({
        step: 'preloadMedia_error',
        file: 'assetPreloader.js',
        method: 'preloadMedia',
        flag: 'error',
        purpose: 'Media preload failed'
      });
      reject(new Error(`Failed to preload ${type}: ${src}`));
    };
    
    document.head.appendChild(link);
  });

  preloadInProgress.set(src, promise);
  return promise;
}

/**
 * @function preloadScript
 * @description Preload a script asset
 * @param {string} src - Script source URL
 * @param {object} options - Preload options
 * @returns {Promise<void>} Completion promise
 */
export function preloadScript(src, options = {}) {
  log('assetPreloader.js', 'preloadScript', 'start', 'Preloading script', { src, options });
  window.performanceTracker.step({
    step: 'preloadScript_start',
    file: 'assetPreloader.js',
    method: 'preloadScript',
    flag: 'start',
    purpose: 'Preload script asset'
  });

  if (preloadedAssets.has(src)) {
    log('assetPreloader.js', 'preloadScript', 'already-preloaded', 'Script already preloaded', { src });
    window.performanceTracker.step({
      step: 'preloadScript_cached',
      file: 'assetPreloader.js',
      method: 'preloadScript',
      flag: 'cache-hit',
      purpose: 'Script already preloaded'
    });
    return Promise.resolve();
  }

  if (preloadInProgress.has(src)) {
    log('assetPreloader.js', 'preloadScript', 'in-progress', 'Script preload already in progress', { src });
    return preloadInProgress.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = src;
    
    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }
    
    link.onload = () => {
      preloadedAssets.add(src);
      preloadInProgress.delete(src);
      log('assetPreloader.js', 'preloadScript', 'success', 'Script preloaded successfully', { src });
      window.performanceTracker.step({
        step: 'preloadScript_complete',
        file: 'assetPreloader.js',
        method: 'preloadScript',
        flag: 'success',
        purpose: 'Script preload complete'
      });
      resolve();
    };
    
    link.onerror = (error) => {
      preloadInProgress.delete(src);
      log('assetPreloader.js', 'preloadScript', 'error', 'Script preload failed', { 
        src, 
        error: error.message || 'Load error' 
      });
      window.performanceTracker.step({
        step: 'preloadScript_error',
        file: 'assetPreloader.js',
        method: 'preloadScript',
        flag: 'error',
        purpose: 'Script preload failed'
      });
      reject(new Error(`Failed to preload script: ${src}`));
    };
    
    document.head.appendChild(link);
  });

  preloadInProgress.set(src, promise);
  return promise;
}

/**
 * @function preloadAsset
 * @description Preload a single asset based on type
 * @param {object} asset - Asset definition { src, type, priority, ...options }
 * @returns {Promise<void>} Completion promise
 */
export async function preloadAsset(asset) {
  log('assetPreloader.js', 'preloadAsset', 'start', 'Preloading asset', { asset });
  window.performanceTracker.step({
    step: 'preloadAsset_start',
    file: 'assetPreloader.js',
    method: 'preloadAsset',
    flag: 'start',
    purpose: 'Preload single asset'
  });

  try {
    const { src, type, ...options } = asset;

    switch (type) {
      case 'image':
        await preloadImage(src, options);
        break;
      case 'font':
        await preloadFont(src, options);
        break;
      case 'video':
        await preloadMedia(src, 'video', options);
        break;
      case 'audio':
        await preloadMedia(src, 'audio', options);
        break;
      case 'script':
        await preloadScript(src, options);
        break;
      default:
        log('assetPreloader.js', 'preloadAsset', 'unknown-type', 'Unknown asset type', { src, type });
        window.performanceTracker.step({
          step: 'preloadAsset_unknown_type',
          file: 'assetPreloader.js',
          method: 'preloadAsset',
          flag: 'unknown',
          purpose: 'Unknown asset type'
        });
        return;
    }

    log('assetPreloader.js', 'preloadAsset', 'success', 'Asset preloaded', { src, type });
    window.performanceTracker.step({
      step: 'preloadAsset_complete',
      file: 'assetPreloader.js',
      method: 'preloadAsset',
      flag: 'success',
      purpose: 'Asset preload complete'
    });
  } catch (error) {
    log('assetPreloader.js', 'preloadAsset', 'error', 'Asset preload failed', { 
      asset, 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'preloadAsset_error',
      file: 'assetPreloader.js',
      method: 'preloadAsset',
      flag: 'error',
      purpose: 'Asset preload failed'
    });
    // Don't throw - continue preloading other assets
  }
}

/**
 * @function preloadAssets
 * @description Preload multiple assets in parallel
 * @param {Array<object>} assets - Array of asset definitions
 * @returns {Promise<void>} Completion promise
 */
export async function preloadAssets(assets) {
  log('assetPreloader.js', 'preloadAssets', 'start', 'Preloading multiple assets', { count: assets.length });
  window.performanceTracker.step({
    step: 'preloadAssets_start',
    file: 'assetPreloader.js',
    method: 'preloadAssets',
    flag: 'start',
    purpose: 'Preload multiple assets'
  });

  try {
    // Sort by priority (high first)
    const sortedAssets = [...assets].sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityMap[a.priority] || 1;
      const bPriority = priorityMap[b.priority] || 1;
      return bPriority - aPriority;
    });

    log('assetPreloader.js', 'preloadAssets', 'sorted', 'Assets sorted by priority', { count: sortedAssets.length });

    // Preload all assets in parallel
    await Promise.allSettled(sortedAssets.map(asset => preloadAsset(asset)));

    log('assetPreloader.js', 'preloadAssets', 'success', 'All assets preloaded', { count: assets.length });
    window.performanceTracker.step({
      step: 'preloadAssets_complete',
      file: 'assetPreloader.js',
      method: 'preloadAssets',
      flag: 'success',
      purpose: 'Multiple assets preload complete'
    });
  } catch (error) {
    log('assetPreloader.js', 'preloadAssets', 'error', 'Error preloading assets', { 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'preloadAssets_error',
      file: 'assetPreloader.js',
      method: 'preloadAssets',
      flag: 'error',
      purpose: 'Multiple assets preload failed'
    });
  }
}

/**
 * @function preloadSectionAssets
 * @description Preload all assets for a specific section
 * @param {string} sectionName - Section name
 * @returns {Promise<void>} Completion promise
 */
export async function preloadSectionAssets(sectionName) {
  log('assetPreloader.js', 'preloadSectionAssets', 'start', 'Preloading section assets', { sectionName });
  window.performanceTracker.step({
    step: 'preloadSectionAssets_start',
    file: 'assetPreloader.js',
    method: 'preloadSectionAssets',
    flag: 'start',
    purpose: 'Preload all assets for section'
  });

  try {
    // Get section manifest
    const { getRouteConfiguration } = await import('../route/routeConfigLoader');
    const routes = getRouteConfiguration();
    
    // Find all routes for this section
    const sectionRoutes = routes.filter(route => {
      if (typeof route.section === 'string') {
        return route.section === sectionName;
      }
      if (typeof route.section === 'object') {
        return Object.values(route.section).includes(sectionName);
      }
      return false;
    });

    log('assetPreloader.js', 'preloadSectionAssets', 'routes-found', 'Section routes found', { 
      sectionName, 
      routeCount: sectionRoutes.length 
    });

    // Collect all assets from these routes
    const allAssets = [];
    for (const route of sectionRoutes) {
      if (route.assetPreload && Array.isArray(route.assetPreload)) {
        allAssets.push(...route.assetPreload);
      }
    }

    log('assetPreloader.js', 'preloadSectionAssets', 'assets-collected', 'Assets collected for section', { 
      sectionName, 
      assetCount: allAssets.length 
    });

    // Preload all collected assets
    await preloadAssets(allAssets);

    log('assetPreloader.js', 'preloadSectionAssets', 'success', 'Section assets preloaded', { 
      sectionName, 
      assetCount: allAssets.length 
    });
    window.performanceTracker.step({
      step: 'preloadSectionAssets_complete',
      file: 'assetPreloader.js',
      method: 'preloadSectionAssets',
      flag: 'success',
      purpose: 'Section assets preload complete'
    });
  } catch (error) {
    log('assetPreloader.js', 'preloadSectionAssets', 'error', 'Error preloading section assets', { 
      sectionName, 
      error: error.message, 
      stack: error.stack 
    });
    window.performanceTracker.step({
      step: 'preloadSectionAssets_error',
      file: 'assetPreloader.js',
      method: 'preloadSectionAssets',
      flag: 'error',
      purpose: 'Section assets preload failed'
    });
  }
}

/**
 * @function clearPreloadCache
 * @description Clear the preloaded assets cache
 * @returns {void}
 */
export function clearPreloadCache() {
  log('assetPreloader.js', 'clearPreloadCache', 'start', 'Clearing preload cache', { cacheSize: preloadedAssets.size });
  window.performanceTracker.step({
    step: 'clearPreloadCache',
    file: 'assetPreloader.js',
    method: 'clearPreloadCache',
    flag: 'clear',
    purpose: 'Clear preload cache'
  });

  preloadedAssets.clear();
  preloadInProgress.clear();

  log('assetPreloader.js', 'clearPreloadCache', 'success', 'Preload cache cleared', {});
}

/**
 * @function getPreloadedAssetsCount
 * @description Get count of preloaded assets
 * @returns {number} Count of preloaded assets
 */
export function getPreloadedAssetsCount() {
  const count = preloadedAssets.size;
  
  log('assetPreloader.js', 'getPreloadedAssetsCount', 'get', 'Getting preloaded assets count', { count });
  window.performanceTracker.step({
    step: 'getPreloadedAssetsCount',
    file: 'assetPreloader.js',
    method: 'getPreloadedAssetsCount',
    flag: 'get',
    purpose: 'Get preload count'
  });
  
  return count;
}


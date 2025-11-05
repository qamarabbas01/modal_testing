// vueApp-main-new/src/utils/assets/index.js

/**
 * @file index.js
 * @description Exports all asset utilities
 * @purpose Central export point for asset module
 */

// Export asset preloader functions
export {
  preloadImage,
  preloadFont,
  preloadMedia,
  preloadScript,
  preloadAsset,
  preloadAssets,
  preloadSectionAssets,
  clearPreloadCache,
  getPreloadedAssetsCount
} from './assetPreloader';

// Export asset scanner functions
export {
  extractAssetsFromComponent,
  scanComponentForAssetReferences,
  scanSectionComponents,
  shouldIgnoreComponent,
  normalizeAssetDefinition
} from './assetScanner';


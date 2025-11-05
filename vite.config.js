/**
 * Vite Configuration
 * 
 * Section-based architecture with automatic code splitting per section.
 * Tailwind CSS compiled via PostCSS.
 */

import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { createSectionBundlerPlugin, createManifestGeneratorPlugin } from './build/vite/index.js';

// Section-based bundling plugin
const sectionBundler = createSectionBundlerPlugin();

// Manifest generator plugin (runs after build)
const manifestGenerator = createManifestGeneratorPlugin();

export default defineConfig(({ mode }) => {
  console.log(`[Vite] Building in ${mode} mode`);

  return {
    // Plugins
    plugins: [
      vue(),
      vueDevTools(),
      sectionBundler,
      manifestGenerator
    ],

    // Global constants
    define: {
      global: 'globalThis',
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
    },

    // Path resolution
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        buffer: 'buffer'
      }
    },

    // Public directory
    publicDir: 'public',

    // Test configuration
    test: {
      environment: 'jsdom',
      globals: true
    },

    // Build configuration
    build: {
      // Generate sourcemaps for debugging
      sourcemap: true,

      // Code splitting per section (not per CSS file globally)
      cssCodeSplit: true,

      // Don't inline assets - keep them separate for preloading
      assetsInlineLimit: 0,

      // Target modern browsers
      target: 'es2020',

      // Rollup options
      rollupOptions: {
        output: {
          // Naming patterns for chunks
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',

          // Manual chunks configuration is handled by sectionBundler plugin
          // It will inject the manualChunks function automatically
        }
      },

      // Minification
      minify: mode === 'production' ? 'esbuild' : false,

      // Chunk size warnings
      chunkSizeWarningLimit: 1000 // 1MB warning threshold
    },

    // Development server configuration
    server: {
      port: 5173,
      strictPort: false,
      open: false,
      cors: true,
      
      // HMR configuration
      hmr: {
        overlay: true
      }
    },

    // Preview server configuration
    preview: {
      port: 4173,
      strictPort: false,
      open: false
    },

    // Optimization
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'vue-i18n'
      ],
      exclude: [
        // Exclude section translations from optimization
        // They will be lazy loaded
      ]
    }
  };
});


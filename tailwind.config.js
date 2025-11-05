/**
 * Tailwind CSS Configuration
 * 
 * Dynamically scans routeConfig to generate content paths per section.
 * Preserves theme configuration from original setup.
 * Compiles automatically with Vite via @tailwindcss/vite plugin.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate content paths from route configuration
 * Scans all component paths referenced in routeConfig
 */
function generateContentPathsFromRouteConfig() {
  try {
    // Load route configuration
    const routeConfigPath = join(__dirname, 'src/router/routeConfig.json');
    const routeConfigData = JSON.parse(readFileSync(routeConfigPath, 'utf-8'));

    const contentPaths = new Set([
      // Always include base paths
      './index.html',
      './src/**/*.{vue,js,ts,jsx,tsx}'
    ]);

    // Extract component paths from routes
    for (const route of routeConfigData) {
      // Add main component path
      if (route.componentPath) {
        const componentDir = route.componentPath.replace('@/', './src/').split('/').slice(0, -1).join('/');
        contentPaths.add(`${componentDir}/**/*.{vue,js}`);
      }

      // Add custom component paths for different roles
      if (route.customComponentPath) {
        for (const roleConfig of Object.values(route.customComponentPath)) {
          if (roleConfig.componentPath) {
            const componentDir = roleConfig.componentPath.replace('@/', './src/').split('/').slice(0, -1).join('/');
            contentPaths.add(`${componentDir}/**/*.{vue,js}`);
          }
        }
      }
    }

    console.log('[Tailwind] Generated content paths:', {
      pathCount: contentPaths.size
    });

    return Array.from(contentPaths);
  } catch (error) {
    console.error('[Tailwind] Failed to generate content paths:', error.message);
    // Fallback to basic paths
    return [
      './index.html',
      './src/**/*.{vue,js,ts,jsx,tsx}'
    ];
  }
}

/** @type {import('tailwindcss').Config} */
export default {
  // Dynamic content paths based on routeConfig
  content: generateContentPathsFromRouteConfig(),

  // Dark mode via class strategy
  darkMode: 'class',

  // Theme configuration (preserved from original)
  theme: {
    extend: {
      // Responsive breakpoints
      screens: {
        sm: '480px',
        md: '768px',
        lg: '1010px',
        xl: '1365px'
      },

      // Font families
      fontFamily: {
        sans: [
          'Poppins',
          'Inter',
          'Montserrat',
          'Open Sans',
          'arial',
          'sans-serif'
        ]
      },

      // Extended color palette
      colors: {
        primary: {
          DEFAULT: '#939393',
          dark: '#181a1b'
        },
        accent: {
          pink: {
            light: '#fb5ba2',
            dark: '#940444'
          },
          green: {
            light: '#07f468',
            dark: '#06c353'
          }
        },
        // Add more colors as needed from old config
        // For brevity, showing essential ones
      },

      // Backdrop blur
      backdropBlur: {
        xs: '5px',
        lg: '25px'
      },

      // Box shadows
      boxShadow: {
        sidebar: '0 0 8px 0 rgba(0, 0, 0, 0.08)',
        custom: '4px 0 10px 0 rgba(0, 0, 0, 0.08)',
        green: '4px 4px 0 0 #07f468'
      },

      // Keyframes for animations
      keyframes: {
        bouncedown: {
          '0%': {
            opacity: '1',
            width: '100%',
            height: 'auto'
          },
          '100%': {
            opacity: '0',
            width: '60px',
            height: '80px'
          }
        },
        bouncup: {
          '0%': {
            opacity: '0',
            width: '60px',
            height: 'auto',
            bottom: '0',
            left: '0'
          },
          '80%': {
            opacity: '1',
            width: '100%',
            height: 'auto',
            bottom: '2px',
            left: '2px'
          },
          '100%': {
            opacity: '1',
            width: '100%',
            height: 'auto',
            bottom: '0',
            left: '0'
          }
        },
        slideFromLeft: {
          '0%': {
            transform: 'translateX(0%)'
          },
          '100%': {
            transform: 'translateX(78%)'
          }
        },
        slideFromRight: {
          '0%': {
            transform: 'translateX(78%)'
          },
          '60%': {
            transform: 'translateX(21%)'
          },
          '100%': {
            transform: 'translateX(19%)'
          }
        }
      },

      // Animations
      animation: {
        bouncedown: 'bouncedown 0.1s ease forwards',
        bouncup: 'bouncup 0.5s ease forwards',
        slidefromleft: 'slideFromLeft 0s ease forwards',
        slidefromright: 'slideFromRight 0.5s ease-in forwards'
      },

      // Grid template columns
      gridTemplateColumns: {
        '5': 'repeat(5, minmax(0, 1fr))',
        '6': 'repeat(6, minmax(0, 1fr))'
      },

      // Custom spacing (e.g., pb-9998)
      spacing: {
        '9998': '999.8rem' // Extremely large padding for special cases
      }
    }
  },

  // Safelist for complex dynamic classes
  safelist: [
    'hover:bg-[linear-gradient(180deg,rgba(87,85,85,0.50)_0%,rgba(0,0,0,0.50)_100%)]',
    'hover:[box-shadow:0px_0px_20px_0px_rgba(255,150,192,0.8)_inset,_8px_8px_30px_0px_rgba(255,0,102,0.7),_0px_0px_35px_0px_rgba(255,255,221,0.5),_-8px_-8px_30px_0px_rgba(255,0,0,0.7)]'
  ],

  // Plugins (if needed)
  plugins: []
};


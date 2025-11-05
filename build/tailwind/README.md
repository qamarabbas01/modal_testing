# Tailwind Build System

## Overview
This directory contains the build system for section-based and individual component Tailwind CSS generation.

## Architecture

### Section-Based CSS
- **Purpose**: Generate CSS bundles per section (e.g., `section-auth.css`, `section-dashboard.css`)
- **Location**: `dist/assets/section-{name}-[hash].css`
- **Scope**: All components within a section

### Individual Component CSS
- **Purpose**: Generate isolated CSS for components marked with `tailwind-ignore`
- **Location**: **Co-located next to component** (e.g., `MyComponent.vue` → `MyComponent.css`)
- **Scope**: Single component only

## File Structure

```
build/tailwind/
├── index.js                      # Central export point
├── sectionScanner.js             # Scans routeConfig for sections
├── sectionCssBuilder.js          # Builds section-scoped CSS
├── ignoredComponentHandler.js    # Detects ignored components
├── individualCssGenerator.js     # NEW: Generates per-component CSS
└── README.md                     # This file
```

## Usage

### Marking a Component for Individual CSS

Add one of these markers to your component:

**Option 1: Comment**
```vue
<!-- tailwind-ignore -->
<template>
  <div class="my-component">...</div>
</template>
```

**Option 2: Export Constant**
```vue
<script setup>
export const IGNORE_TAILWIND = true;
</script>
```

### Generated CSS Location

When you mark a component for individual CSS:

**Before:**
```
src/components/special/HeavyComponent.vue
```

**After Build:**
```
src/components/special/HeavyComponent.vue   ← Your component
src/components/special/HeavyComponent.css   ← Auto-generated CSS (co-located)
```

### Auto-Import CSS

The generated CSS file is automatically imported when you use the component:

```vue
<script setup>
import HeavyComponent from '@/components/special/HeavyComponent.vue';
// CSS is automatically loaded via Vite
</script>
```

### Build Process

1. **Scan**: Finds all components with `tailwind-ignore` markers
2. **Extract**: Parses component to find Tailwind classes
3. **Generate**: Creates minimal CSS file with only needed utilities
4. **Co-locate**: Places `.css` file next to `.vue` file
5. **Track**: Creates manifest for build system

### Manual Generation

Run individual component CSS generation:

```bash
node build/tailwind/generateIndividualCss.js
```

### Clean Up Generated Files

Remove all auto-generated component CSS files:

```bash
node build/tailwind/cleanupIndividualCss.js
```

## API Reference

### `generateIndividualComponentCss(componentPath)`
Generates CSS for a single component.

**Parameters:**
- `componentPath` (string): Path to component `.vue` file

**Returns:** 
- Promise<string>: Path to generated `.css` file

**Example:**
```javascript
import { generateIndividualComponentCss } from './build/tailwind/index.js';

const cssPath = await generateIndividualComponentCss(
  'src/components/special/HeavyComponent.vue'
);
// Returns: 'src/components/special/HeavyComponent.css'
```

### `generateAllIndividualComponentCss(baseDirectory)`
Scans directory and generates CSS for all ignored components.

**Parameters:**
- `baseDirectory` (string): Directory to scan

**Returns:**
- Promise<Array<object>>: Array of generation results

**Example:**
```javascript
import { generateAllIndividualComponentCss } from './build/tailwind/index.js';

const results = await generateAllIndividualComponentCss('src/components');
// Returns: [{ component, css, success }, ...]
```

### `createComponentCssManifest(results)`
Creates a manifest mapping components to their CSS files.

**Parameters:**
- `results` (Array): Results from `generateAllIndividualComponentCss`

**Returns:**
- object: Manifest with component → CSS mappings

## Integration with Vite

The individual CSS system integrates with Vite's build process:

1. **Development**: CSS is generated on-demand when components are imported
2. **Production**: CSS is bundled separately and loaded only when component is used
3. **HMR**: Changes to component trigger CSS regeneration

## Best Practices

### When to Use Individual CSS

✅ **Use individual CSS for:**
- Heavy components with complex styles
- Components with many custom Tailwind utilities
- Components used infrequently
- Components that cause CSS bloat in section bundles

❌ **Don't use individual CSS for:**
- Small utility components
- Frequently used components
- Components with minimal styling

### Performance Considerations

**Section CSS** (Default):
- ✅ Fewer HTTP requests
- ✅ Better caching (shared across components)
- ❌ Larger initial bundle size

**Individual CSS**:
- ✅ Smaller initial bundle
- ✅ Lazy-loaded per component
- ❌ More HTTP requests
- ❌ Less cache efficiency

## Troubleshooting

### CSS Not Generated

**Problem**: Component has `tailwind-ignore` but no CSS file created

**Solution**:
1. Check marker syntax (must be exact)
2. Run build script manually
3. Check console for errors

### CSS Not Loading

**Problem**: Component CSS file exists but styles not applying

**Solution**:
1. Verify CSS file is next to component
2. Check Vite dev server console
3. Ensure component is actually imported

### Duplicate Styles

**Problem**: Styles appear in both section CSS and component CSS

**Solution**:
- Ensure `tailwind-ignore` marker is present
- Rebuild section CSS to exclude component
- Clear dist folder and rebuild

## Examples

### Example 1: Simple Component with Individual CSS

```vue
<!-- src/components/chart/ComplexChart.vue -->
<!-- tailwind-ignore -->
<template>
  <div class="chart-container p-4 bg-white rounded-lg shadow-xl">
    <div class="chart-header flex justify-between items-center mb-4">
      <h3 class="text-xl font-bold">Sales Data</h3>
    </div>
    <!-- Complex chart rendering -->
  </div>
</template>

<script setup>
// Component logic
</script>
```

**Generated CSS**: `src/components/chart/ComplexChart.css`

### Example 2: Using Export Constant

```vue
<!-- src/components/heavy/DataTable.vue -->
<template>
  <div class="data-table">
    <!-- Heavy table with many classes -->
  </div>
</template>

<script setup>
export const IGNORE_TAILWIND = true;

// Component logic
</script>
```

**Generated CSS**: `src/components/heavy/DataTable.css`

## Future Enhancements

- [ ] Watch mode for development
- [ ] Automatic detection of heavy components
- [ ] CSS size optimization
- [ ] Critical CSS extraction
- [ ] Component CSS code splitting

## Related Files

- `../vite/sectionBundler.js` - Vite bundling configuration
- `../../src/router/routeConfig.json` - Route and section definitions
- `../../tailwind.config.js` - Main Tailwind configuration


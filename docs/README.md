# Vue App - Section-Based Architecture

A modern Vue.js application built with a section-based architecture for optimized bundling, lazy loading, and performance tracking.

## 📁 Project Structure

```
vueApp-main-new/
├── docs/                    # 📚 Comprehensive documentation
│   ├── DEVELOPER_GUIDE.md         # Complete developer guide
│   ├── TESTING_GUIDE.md           # Testing checklists and guides
│   ├── DEPLOYMENT_GUIDE.md        # Deployment instructions
│   ├── ENV_SETUP_GUIDE.md         # Environment variable guide
│   └── archived/                  # Historical audit and fix documentation
├── src/
│   ├── components/          # Vue components organized by section
│   ├── router/              # Vue Router configuration
│   ├── stores/              # Pinia stores
│   ├── utils/               # Utility functions
│   │   ├── auth/           # Authentication utilities
│   │   ├── assets/         # Asset preloading
│   │   ├── build/          # Build configuration and validation
│   │   ├── common/         # Common utilities (logging, caching, performance)
│   │   ├── route/          # Route configuration and guards
│   │   ├── section/        # Section preloading and resolution
│   │   └── translation/    # i18n and locale management
│   └── i18n/               # Translation files organized by section
├── build/                   # Build configuration
│   ├── buildConfig.js      # Global build settings
│   ├── tailwind/           # Tailwind CSS build utilities
│   └── vite/               # Vite build utilities
└── scripts/                 # Build and validation scripts

```

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

### Environment Validation

```bash
npm run validate-env
```

## 📖 Documentation

All comprehensive documentation is located in the `/docs/` folder:

- **[Developer Guide](/docs/DEVELOPER_GUIDE.md)** - Complete architecture overview, how everything works, and how to test
- **[Testing Guide](/docs/TESTING_GUIDE.md)** - Manual testing checklists for all handlers and flows
- **[Deployment Guide](/docs/DEPLOYMENT_GUIDE.md)** - How to deploy, build, and configure environments
- **[Environment Setup](/docs/ENV_SETUP_GUIDE.md)** - Environment variables, validation, and configuration

## 🏗️ Architecture Overview

This application uses a **section-based architecture** where:

1. **Sections** are self-contained mini-SPAs with their own:
   - Components
   - Translations
   - CSS bundles
   - Assets
   - Preload configuration

2. **Route Configuration** (`src/router/routeConfig.json`) is the single source of truth for:
   - Route paths and components
   - Section assignments
   - Auth requirements
   - Role-based access control
   - Dependency chains
   - Preload strategies

3. **Build System** automatically:
   - Compiles section-specific CSS with Tailwind
   - Bundles JS per section with Vite
   - Generates manifests for each section
   - Optimizes for lazy loading and preloading

## 🔧 Key Features

### Performance Tracking
Global performance tracker (`window.performanceTracker`) tracks all major operations.
- Controlled by `VITE_ENABLE_PERFORMANCE_TRACKING` environment variable
- Initialized once in `main.js`
- Accessible globally throughout the application

### Centralized Logging
Single `log()` function for all logging needs.
- Controlled by `VITE_ENABLE_LOGGER` environment variable
- Format: `[fileName] [methodName] [flag] Description {jsonData}`
- Automatic log before all return statements

### Environment Validation
Validates required environment variables at startup.
- Dev and prod `.env` files
- Runtime validation in browser
- CLI validation via `npm run validate-env`

### Section-Based Routing
Dynamic route generation from `routeConfig.json`.
- Role-based route variants
- Parent config inheritance
- Lazy loading with preload strategies
- Auth guards and dependency checks

### Asset Preloading
Intelligent asset preloading based on route configuration.
- Component-level preload declarations
- Section-based bundling
- Cache management
- Performance tracking

### Internationalization
Lazy-loaded translations per section.
- English fallback always loaded first
- Locale resolution: URL → User Selection → Pinia → Browser → Default
- Translation file validation
- Per-section translation files

## 🧪 Testing

See `/docs/TESTING_GUIDE.md` for comprehensive testing checklists covering:
- Route configuration scenarios
- Authentication flows
- Role-based access
- Section preloading
- Asset preloading
- Translation loading
- Error handling

## 🌐 Environment Variables

See `/docs/ENV_SETUP_GUIDE.md` for complete environment variable documentation.

Key variables:
- `VITE_ENABLE_LOGGER` - Enable/disable logging
- `VITE_ENABLE_PERFORMANCE_TRACKING` - Enable/disable performance tracking
- `VITE_ENABLE_FOOTER_NAVIGATION` - Show/hide footer route navigation
- `VITE_USE_DEV_AUTH` - Use development auth (bypasses AWS Cognito)
- AWS Cognito configuration (Region, User Pool ID, Client ID)

## 🔐 Authentication

Two authentication modes:

1. **Production** - AWS Cognito integration
2. **Development** - Mock authentication with local storage

Controlled by `VITE_USE_DEV_AUTH` environment variable.

See `/docs/DEVELOPER_GUIDE.md` for detailed auth flow documentation.

## 📝 Code Standards

- **Descriptive names** for all methods and constants
- **Logging before all returns** to trace execution flow
- **Performance tracking** for all major operations
- **Error handling** with centralized `logError` utility
- **Comments** for all code and methods
- **Safe access** for all external references (check before use)

## 🛠️ Development Guidelines

1. Always validate route config changes: `npm run validate-env`
2. Test with both dev and prod environment variables
3. Check performance tracker output in dev mode
4. Review logs for all operations
5. Test with different user roles
6. Verify section preloading in network tab
7. Check translation loading for each locale

## 📦 Dependencies

See `package.json` for full dependency list.

Key dependencies:
- Vue 3 (Composition API)
- Vue Router 4
- Pinia (state management)
- Pinia Persisted State
- Vue I18n
- AWS Cognito SDK
- Vite (build tool)
- Tailwind CSS

## 🤝 Contributing

1. Read `/docs/DEVELOPER_GUIDE.md` to understand the architecture
2. Follow code standards and logging patterns
3. Add performance tracking to new operations
4. Update route config schema if adding new route features
5. Add tests to `/docs/TESTING_GUIDE.md` for new features
6. Validate environment changes with `npm run validate-env`

## 📄 License

[Your License Here]

## 📞 Support

For issues or questions, please refer to the documentation in `/docs/` or contact the development team.

---

**Note**: This project uses a section-based architecture for optimal performance and maintainability. Please read the developer guide before making significant changes.

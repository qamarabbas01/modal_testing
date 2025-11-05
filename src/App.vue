<template>
  <div id="app" class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Global Header -->
    <AppHeader ref="appHeader" />

    <!-- Main Content Area -->
    <main class="flex-1">
      <!-- Router view for page content -->
      <RouterView v-slot="{ Component }">
        <Suspense>
          <!-- Main content -->
          <template #default>
            <component :is="Component" />
          </template>

          <!-- Loading fallback -->
          <template #fallback>
            <div class="flex items-center justify-center min-h-screen">
              <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-600">Loading...</p>
              </div>
            </div>
          </template>
        </Suspense>
      </RouterView>
    </main>

    <!-- Global Footer -->
    <AppFooter />
  </div>
</template>

<script setup>
import { onMounted, onErrorCaptured } from 'vue';
import { useRouter } from 'vue-router';
import { log } from './utils/common/logHandler.js';
import AppHeader from './components/layout/AppHeader.vue';
import AppFooter from './components/layout/AppFooter.vue';

// Get router instance
const router = useRouter();

// Track app component mount
onMounted(() => {
  log('App.vue', 'onMounted', 'lifecycle', 'App component mounted', {});
  
  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'appComponentMounted',
      file: 'App.vue',
      method: 'onMounted',
      flag: 'mount',
      purpose: 'App component mounted'
    });
  }
});

// Error boundary for child components
onErrorCaptured((err, instance, info) => {
  log('App.vue', 'onErrorCaptured', 'error', 'Component error captured', {
    error: err.message,
    info,
    componentName: instance?.$options?.name || 'Unknown'
  });

  if (window.performanceTracker) {
    window.performanceTracker.step({
      step: 'componentError',
      file: 'App.vue',
      method: 'onErrorCaptured',
      flag: 'error',
      purpose: `Component error: ${err.message}`
    });
  }

  // Return false to propagate error to global handler
  return false;
});
</script>

<style>
/* Global styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  height: 100%;
  font-family: 'Poppins', 'Inter', sans-serif;
}

#app {
  width: 100%;
  min-height: 100vh;
}

/* Loading animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>


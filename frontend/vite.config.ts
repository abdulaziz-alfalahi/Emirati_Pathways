/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

// Resolve a build/version marker for the feedback report's "App Version" field:
//   1) VITE_APP_VERSION env (CI / prod builds)
//   2) git short SHA (local repo or CI checkout)
//   3) a VERSION file (dev-server deploys where the dir isn't a git repo, e.g. APPQA)
//   4) 'unknown'
function resolveAppVersion(): string {
  if (process.env.VITE_APP_VERSION) return process.env.VITE_APP_VERSION as string;
  try {
    return execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim();
  } catch { /* not a git repo here */ }
  try {
    return fs.readFileSync(path.resolve(__dirname, 'VERSION'), 'utf8').trim();
  } catch { /* no VERSION file */ }
  return 'unknown';
}
const APP_VERSION = resolveAppVersion();
const BUILD_TIME = new Date().toISOString();

// Expose to the client via import.meta.env (Vite statically replaces VITE_* references).
// Any value already set in the environment (e.g. the dev-server launch command or CI)
// takes precedence over the git/VERSION-derived value.
process.env.VITE_APP_VERSION = process.env.VITE_APP_VERSION || APP_VERSION;
process.env.VITE_BUILD_TIME = process.env.VITE_BUILD_TIME || BUILD_TIME;

export default defineConfig({
  plugins: [react()],

  // Define global variables for browser compatibility
  define: {
    'process.env': 'import.meta.env',
    global: 'globalThis',
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },


  // ESBuild configuration for JSX
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  },


  // Server configuration
  server: {
    port: 8089,
    host: true,
    cors: true,
    allowedHosts: [
      'stg-emirati.ehrdc.gov.ae',
      'emirati.ehrdc.gov.ae'
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/health': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/rtc': {
        target: 'http://127.0.0.1:7880',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/twirp': {
        target: 'http://127.0.0.1:7880',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
        secure: false,
      }
    },
  },

  // Build configuration
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          ui: ['lucide-react', '@radix-ui/react-tabs', '@radix-ui/react-alert-dialog'],
          // Heavy libraries — isolated to avoid bloating the main bundle
          charts: ['recharts'],
          pdf: ['jspdf'],
          livekit: ['livekit-client'],
        },
      },
    },
  },

  // Environment variables configuration
  envPrefix: ['VITE_', 'REACT_APP_'],

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e'],
    coverage: {
      provider: 'v8', // Added required provider property
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
      ],
    },
    typecheck: {
      enabled: false,
      ignoreSourceErrors: true
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/utils': path.resolve(__dirname, './src/lib/utils'),
    },
  },

  // Optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
    ],
  },
});

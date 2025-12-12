/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  // Define global variables for browser compatibility
  define: {
    'process.env': 'import.meta.env',
    global: 'globalThis',
  },

  // Server configuration
  server: {
    port: 8089,
    host: true,
    cors: true,
    allowedHosts: [
      '2415733d5eb0.ngrok.app',
      'archdiocesan-complimentarily-marianna.ngrok-free.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5003',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
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
          ui: ['lucide-react', '@radix-ui/react-tabs', '@radix-ui/react-alert-dialog'],
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

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
    port: 8080,
    host: true,
    cors: true,
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

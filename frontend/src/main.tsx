import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Ensure we have a root element
const rootElement = document.getElementById("root");
if (!rootElement) {
  const newRoot = document.createElement("div");
  newRoot.id = "root";
  document.body.appendChild(newRoot);
}

const root = document.getElementById("root");

// Simple rendering without complex initialization
try {
  if (root) {
    createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
  console.log("App rendered successfully");
} catch (error) {
  console.error("Failed to render app:", error);

  // Fallback error display
  if (root) {
    root.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <h1 style="color: #ef4444; margin-bottom: 16px;">Application Error</h1>
          <p style="color: #6b7280;">Please refresh the page to try again.</p>
          <button onclick="window.location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload
          </button>
        </div>
      </div>
    `;
  }
}

// Force unregister legacy Service Workers to clear stale cache (fixes 404 font issues)
// Aggressive Service Worker Cleanup for Dev Environment
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    console.log('SW: Unregistering ready worker:', registration);
    registration.unregister();
  }).catch(e => console.error('SW ready error:', e));

  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      console.log('SW: Force unregistering from main.tsx:', registration);
      registration.unregister();
    }
  });

  // Force reload if we detect a controller that shouldn't be there
  if (navigator.serviceWorker.controller) {
    console.log('SW: Controller detected, reloading in 1s...');
    setTimeout(() => {
      // Only reload if we haven't just reloaded (prevention loop would be good but simple is better now)
      // window.location.reload(); 
      // Commented out reload to avoid infinite loops, but the unregister needs to happen first.
    }, 1000);
  }
}

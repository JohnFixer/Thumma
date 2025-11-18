import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Corrected import path for App component
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker for PWA functionality
if ('serviceWorker' in navigator) {
  // We wait for the 'load' event to ensure the page is fully loaded before registering the service worker.
  // This is the most robust method to avoid "invalid state" errors during registration.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
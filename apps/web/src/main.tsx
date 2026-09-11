import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import { AccessibilityProvider } from './context/AccessibilityContext.js';
import { AuthProvider } from './context/AuthContext.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AccessibilityProvider>
  </React.StrictMode>
);

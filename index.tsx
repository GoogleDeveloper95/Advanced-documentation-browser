/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Module 'App' has no default export. Added a default export to App.tsx.
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

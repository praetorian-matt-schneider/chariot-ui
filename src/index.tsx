import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/ibm-plex-mono';

import { App } from './app/App';

import './index.css';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement ?? document.createElement('div'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

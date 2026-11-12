import * as React from 'react';
import GlobalStyles from '@mui/material/GlobalStyles';
import { StyledEngineProvider } from '@mui/material/styles';
import * as ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';

import App from '@/App';

import '@/index.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';

// After a deploy, lazily loaded chunks referenced by an already open tab may
// no longer exist (hashes changed). Reload to pick up the fresh index.
window.addEventListener('vite:preloadError', event => {
  event.preventDefault();
  window.location.reload();
});

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <StyledEngineProvider injectFirst>
        <GlobalStyles styles='@layer theme, base, mui, components, utilities;' />
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </StyledEngineProvider>
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}

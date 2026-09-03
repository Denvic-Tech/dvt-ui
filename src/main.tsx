import * as React from 'react';
import GlobalStyles from '@mui/material/GlobalStyles';
import { StyledEngineProvider } from '@mui/material/styles';
import * as ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';

import { configureMonaco } from '@/app/providers/monaco/configureMonaco';

import App from '@/App';

import '@/index.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';

const root = document.getElementById('root');

if (root) {
  const rootElement = ReactDOM.createRoot(root);
  const renderApp = () => {
    rootElement.render(
      <React.StrictMode>
        <StyledEngineProvider injectFirst>
          <GlobalStyles styles='@layer theme, base, mui, components, utilities;' />
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </StyledEngineProvider>
      </React.StrictMode>
    );
  };

  void configureMonaco()
    .catch(error => {
      console.error('Failed to configure Monaco loader', error);
    })
    .finally(() => {
      renderApp();
    });
} else {
  console.error('Root element not found');
}

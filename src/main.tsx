import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material/styles';
import App from './App';
import { store } from './store';
import { ThemeProviders } from './theme/ThemeProviders';
import './index.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <StyledEngineProvider injectFirst>
          <ThemeProviders>
            <App />
          </ThemeProviders>
        </StyledEngineProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);

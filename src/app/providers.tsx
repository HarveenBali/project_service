import { Suspense } from 'react';
import type { ReactNode } from 'react';
import CircularProgress from '@mui/joy/CircularProgress';
import Box from '@mui/joy/Box';
import { StyledEngineProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';
import { ToastHost } from '../components/feedback/ToastHost';
import { ThemeProviders } from '../theme/ThemeProviders';
import { store } from './store';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <StyledEngineProvider injectFirst>
          <ThemeProviders>
            <ErrorBoundary>
              <Suspense fallback={<Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>}>
                {children}
              </Suspense>
              <ToastHost />
            </ErrorBoundary>
          </ThemeProviders>
        </StyledEngineProvider>
      </BrowserRouter>
    </Provider>
  );
}

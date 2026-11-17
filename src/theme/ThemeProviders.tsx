import { useMemo } from 'react';
import type { ReactNode } from 'react';
import CssBaseline from '@mui/joy/CssBaseline';
import { CssVarsProvider, useColorScheme } from '@mui/joy/styles';
import { THEME_ID, ThemeProvider, createTheme } from '@mui/material/styles';

/**
 * Joy UI owns the design tokens and light/dark switching. Material UI components
 * (table, dialog, pagination, text fields) are scoped under THEME_ID and follow
 * the same colour mode, so both libraries look consistent.
 */
function MaterialBridge({ children }: { children: ReactNode }) {
  const { mode, systemMode } = useColorScheme();
  const resolved = (mode === 'system' ? systemMode : mode) ?? 'light';
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: { mode: resolved },
        typography: { fontFamily: 'var(--joy-fontFamily-body, Inter, system-ui, sans-serif)' },
      }),
    [resolved],
  );
  return <ThemeProvider theme={{ [THEME_ID]: muiTheme }}>{children}</ThemeProvider>;
}

export function ThemeProviders({ children }: { children: ReactNode }) {
  return (
    <CssVarsProvider defaultMode="system" modeStorageKey="pm-color-mode">
      <CssBaseline />
      <MaterialBridge>{children}</MaterialBridge>
    </CssVarsProvider>
  );
}

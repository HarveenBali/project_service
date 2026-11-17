import { useMemo } from 'react';
import type { ReactNode } from 'react';
import CssBaseline from '@mui/joy/CssBaseline';
import { CssVarsProvider, extendTheme, useColorScheme } from '@mui/joy/styles';
import { THEME_ID, ThemeProvider, createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

const joyTheme = extendTheme({
  fontFamily: { body: tokens.fontFamily, display: tokens.fontFamily },
  radius: { sm: `${tokens.radius.sm}px`, md: `${tokens.radius.md}px`, lg: `${tokens.radius.lg}px`, xs: '4px', xl: '20px' },
  colorSchemes: {
    light: { palette: { primary: { ...tokens.brand, solidBg: tokens.brand[600], solidHoverBg: tokens.brand[700] } } },
    dark: { palette: { primary: { ...tokens.brand, solidBg: tokens.brand[500], solidHoverBg: tokens.brand[400] } } },
  },
});

/**
 * Joy UI owns light/dark switching. Material UI components (data grid, dialogs, text
 * fields) live under THEME_ID and are built from the same tokens and colour mode.
 */
function MaterialBridge({ children }: { children: ReactNode }) {
  const { mode, systemMode } = useColorScheme();
  const resolved = (mode === 'system' ? systemMode : mode) ?? 'light';
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: { mode: resolved, primary: { main: resolved === 'dark' ? tokens.brand[400] : tokens.brand[600] } },
        shape: { borderRadius: tokens.radius.md },
        typography: { fontFamily: tokens.fontFamily },
      }),
    [resolved],
  );
  return <ThemeProvider theme={{ [THEME_ID]: muiTheme }}>{children}</ThemeProvider>;
}

export function ThemeProviders({ children }: { children: ReactNode }) {
  return (
    <CssVarsProvider theme={joyTheme} defaultMode="system" modeStorageKey="flowsync-color-mode">
      <CssBaseline />
      <MaterialBridge>{children}</MaterialBridge>
    </CssVarsProvider>
  );
}

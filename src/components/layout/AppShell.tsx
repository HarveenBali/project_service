import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/joy/Box';
import CircularProgress from '@mui/joy/CircularProgress';
import Divider from '@mui/joy/Divider';
import Drawer from '@mui/joy/Drawer';
import Typography from '@mui/joy/Typography';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setPaletteOpen } from '../../app/uiSlice';
import { APP_NAME } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { ErrorBoundary } from '../feedback/ErrorBoundary';
import { CommandPalette } from './CommandPalette';
import { Header } from './Header';
import { NavList, Sidebar } from './Sidebar';

export function AppShell() {
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const paletteOpen = useAppSelector((s) => s.ui.paletteOpen);
  useAuth(); // starts the session-expiry timer for the whole authenticated area

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch(setPaletteOpen(!paletteOpen));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, paletteOpen]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        component="a"
        href="#main"
        sx={{ position: 'absolute', left: -9999, '&:focus': { left: 8, top: 8, zIndex: 3000, bgcolor: 'background.surface', p: 1, borderRadius: 'sm' } }}
      >
        Skip to content
      </Box>
      <Sidebar />
      <Drawer open={drawer} onClose={() => setDrawer(false)}>
        <Typography level="title-lg" sx={{ p: 2, color: 'primary.500' }}>{APP_NAME}</Typography>
        <Divider />
        <NavList onNavigate={() => setDrawer(false)} />
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header onOpenMenu={() => setDrawer(true)} />
        <Box component="main" id="main" tabIndex={-1} sx={{ p: { xs: 2, md: 3 }, flexGrow: 1, outline: 'none' }}>
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box>}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
      <CommandPalette />
    </Box>
  );
}

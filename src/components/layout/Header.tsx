import { useNavigate } from 'react-router-dom';
import ArrowDropDownRounded from '@mui/icons-material/ArrowDropDownRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Dropdown from '@mui/joy/Dropdown';
import IconButton from '@mui/joy/IconButton';
import Menu from '@mui/joy/Menu';
import MenuButton from '@mui/joy/MenuButton';
import MenuItem from '@mui/joy/MenuItem';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import { useColorScheme } from '@mui/joy/styles';
import { useAppDispatch } from '../../app/hooks';
import { setPaletteOpen } from '../../app/uiSlice';
import { ROLE_LABEL } from '../../constants';
import { NotificationBell } from '../../features/notifications/NotificationBell';
import { useAuth, useCurrentUser } from '../../hooks/useAuth';
import { useScopedData } from '../../hooks/useScopedData';
import { UserAvatar } from '../common/UserAvatar';
import { AppBreadcrumbs } from './Breadcrumbs';

function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const dark = (mode === 'system' ? systemMode : mode) === 'dark';
  return (
    <IconButton variant="plain" size="sm" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setMode(dark ? 'light' : 'dark')}>
      {dark ? <LightModeRounded /> : <DarkModeRounded />}
    </IconButton>
  );
}

function ProjectSwitcher() {
  const navigate = useNavigate();
  const { projects } = useScopedData();
  return (
    <Dropdown>
      <MenuButton size="sm" variant="outlined" color="neutral" endDecorator={<ArrowDropDownRounded />} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
        Projects
      </MenuButton>
      <Menu size="sm" placement="bottom-start" sx={{ minWidth: 220, maxHeight: 360, overflow: 'auto' }}>
        {projects.length === 0 && <Typography level="body-sm" sx={{ p: 1.5 }}>No projects yet.</Typography>}
        {projects.map((p) => (
          <MenuItem key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>{p.name}</MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
}

function ProfileMenu() {
  const user = useCurrentUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <Dropdown>
      <MenuButton variant="plain" size="sm" sx={{ gap: 1 }} aria-label="Account menu">
        <UserAvatar user={user} />
        <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
          <Typography level="title-sm">{user.name}</Typography>
          <Typography level="body-xs">{ROLE_LABEL[user.role]}</Typography>
        </Box>
      </MenuButton>
      <Menu placement="bottom-end" size="sm">
        <MenuItem onClick={() => navigate('/settings')}>Settings</MenuItem>
        <MenuItem color="danger" onClick={signOut}>Sign out</MenuItem>
      </Menu>
    </Dropdown>
  );
}

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const dispatch = useAppDispatch();
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);
  return (
    <Sheet
      component="header"
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, height: 56, borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, zIndex: 10 }}
    >
      <IconButton sx={{ display: { md: 'none' } }} variant="plain" size="sm" aria-label="Open navigation" onClick={onOpenMenu}>
        <MenuRounded />
      </IconButton>
      <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
        <AppBreadcrumbs />
      </Box>
      <ProjectSwitcher />
      <Box sx={{ flexGrow: 1 }} />
      <Button
        size="sm"
        variant="outlined"
        color="neutral"
        startDecorator={<SearchRounded />}
        endDecorator={<Typography level="body-xs" sx={{ display: { xs: 'none', md: 'block' } }}>{isMac ? '⌘K' : 'Ctrl K'}</Typography>}
        onClick={() => dispatch(setPaletteOpen(true))}
        sx={{ minWidth: { sm: 200 }, justifyContent: 'flex-start', fontWeight: 400 }}
        aria-label="Search and commands"
      >
        <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Search…</Box>
      </Button>
      <NotificationBell />
      <ColorModeToggle />
      <ProfileMenu />
    </Sheet>
  );
}

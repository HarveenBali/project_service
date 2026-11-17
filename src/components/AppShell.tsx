import { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AssignmentRounded from '@mui/icons-material/AssignmentRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import InsightsRounded from '@mui/icons-material/InsightsRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import Box from '@mui/joy/Box';
import Chip from '@mui/joy/Chip';
import CircularProgress from '@mui/joy/CircularProgress';
import Divider from '@mui/joy/Divider';
import Drawer from '@mui/joy/Drawer';
import Dropdown from '@mui/joy/Dropdown';
import IconButton from '@mui/joy/IconButton';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import Menu from '@mui/joy/Menu';
import MenuButton from '@mui/joy/MenuButton';
import MenuItem from '@mui/joy/MenuItem';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import { useColorScheme } from '@mui/joy/styles';
import { ROLE_LABEL } from '../constants';
import { useAppDispatch, useAppSelector } from '../store';
import { switchUser } from '../store/authSlice';
import { USERS } from '../mock/seed';
import { can } from '../utils/permissions';
import type { Action } from '../utils/permissions';
import { UserAvatar } from './UserAvatar';

const NAV: { to: string; label: string; icon: React.ReactNode; requires?: Action }[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardRounded /> },
  { to: '/projects', label: 'Projects', icon: <FolderRounded /> },
  { to: '/tasks', label: 'Tasks', icon: <AssignmentRounded /> },
  { to: '/analytics', label: 'Analytics', icon: <InsightsRounded />, requires: 'analytics:view' },
  { to: '/team', label: 'Team', icon: <GroupsRounded />, requires: 'team:view' },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const role = useAppSelector((s) => s.auth.user.role);
  const { pathname } = useLocation();
  return (
    <List size="sm" sx={{ gap: 0.5, p: 1 }}>
      {NAV.filter((n) => !n.requires || can(role, n.requires)).map((n) => {
        const selected = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to);
        return (
          <ListItem key={n.to}>
            <ListItemButton component={NavLink} to={n.to} selected={selected} onClick={onNavigate} sx={{ borderRadius: 'sm' }}>
              <ListItemDecorator>{n.icon}</ListItemDecorator>
              {n.label}
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const dark = (mode === 'system' ? systemMode : mode) === 'dark';
  return (
    <IconButton variant="plain" size="sm" aria-label="Toggle colour mode" onClick={() => setMode(dark ? 'light' : 'dark')}>
      {dark ? <LightModeRounded /> : <DarkModeRounded />}
    </IconButton>
  );
}

function UserMenu() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  return (
    <Dropdown>
      <MenuButton variant="plain" size="sm" sx={{ gap: 1 }}>
        <UserAvatar user={user} />
        <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
          <Typography level="title-sm">{user.name}</Typography>
          <Typography level="body-xs">{ROLE_LABEL[user.role]}</Typography>
        </Box>
      </MenuButton>
      <Menu placement="bottom-end" size="sm">
        <Typography level="body-xs" sx={{ px: 1.5, py: 0.5 }}>
          Sign in as (demo)
        </Typography>
        {USERS.map((u) => (
          <MenuItem key={u.id} selected={u.id === user.id} onClick={() => dispatch(switchUser(u))}>
            <UserAvatar user={u} />
            {u.name}
            <Chip size="sm" variant="soft" sx={{ ml: 'auto' }}>
              {ROLE_LABEL[u.role]}
            </Chip>
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
}

export function AppShell() {
  const [drawer, setDrawer] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100%' }}>
      <Sheet
        variant="outlined"
        sx={{ width: 220, flexShrink: 0, display: { xs: 'none', md: 'block' }, borderWidth: '0 1px 0 0', position: 'sticky', top: 0, height: '100vh' }}
      >
        <Typography level="title-lg" sx={{ p: 2 }}>
          Service PM
        </Typography>
        <Divider />
        <NavList />
      </Sheet>

      <Drawer open={drawer} onClose={() => setDrawer(false)}>
        <Typography level="title-lg" sx={{ p: 2 }}>
          Service PM
        </Typography>
        <Divider />
        <NavList onNavigate={() => setDrawer(false)} />
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Sheet
          component="header"
          variant="outlined"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, borderWidth: '0 0 1px 0', position: 'sticky', top: 0, zIndex: 10 }}
        >
          <IconButton sx={{ display: { md: 'none' } }} variant="plain" size="sm" aria-label="Open menu" onClick={() => setDrawer(true)}>
            <MenuRounded />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <ColorModeToggle />
          <UserMenu />
        </Sheet>
        <Box component="main" sx={{ p: { xs: 2, md: 3 }, flexGrow: 1 }}>
          <Suspense fallback={<Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box>}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}

import { NavLink, useLocation } from 'react-router-dom';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import Tooltip from '@mui/joy/Tooltip';
import Typography from '@mui/joy/Typography';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toggleSidebar } from '../../app/uiSlice';
import { APP_NAME } from '../../constants';
import { usePermissions } from '../../hooks/usePermissions';
import { tokens } from '../../theme/tokens';
import { NAV_ITEMS } from './navigation';

export function NavList({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { can } = usePermissions();
  const { pathname } = useLocation();
  return (
    <List size="sm" sx={{ gap: 0.5, p: 1 }} component="nav" aria-label="Main">
      {NAV_ITEMS.filter((n) => !n.requires || can(n.requires)).map((n) => {
        const selected = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to);
        return (
          <ListItem key={n.to}>
            <Tooltip title={collapsed ? n.label : ''} placement="right">
              <ListItemButton
                component={NavLink}
                to={n.to}
                selected={selected}
                aria-current={selected ? 'page' : undefined}
                onClick={onNavigate}
                sx={{ borderRadius: 'sm', justifyContent: collapsed ? 'center' : undefined }}
              >
                <ListItemDecorator sx={{ minInlineSize: collapsed ? 0 : undefined }}>{n.icon}</ListItemDecorator>
                {!collapsed && <ListItemContent>{n.label}</ListItemContent>}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        );
      })}
    </List>
  );
}

export function Sidebar() {
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const dispatch = useAppDispatch();
  return (
    <Box
      component="aside"
      sx={{
        width: collapsed ? tokens.sidebar.collapsedWidth : tokens.sidebar.width,
        flexShrink: 0,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        height: '100vh',
        bgcolor: 'background.surface',
        transition: 'width .2s ease',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', px: 2, height: 56 }}>
        {!collapsed && <Typography level="title-lg" sx={{ color: 'primary.500' }}>{APP_NAME}</Typography>}
        <IconButton size="sm" variant="plain" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} onClick={() => dispatch(toggleSidebar())}>
          {collapsed ? <ChevronRightRounded /> : <ChevronLeftRounded />}
        </IconButton>
      </Box>
      <NavList collapsed={collapsed} />
    </Box>
  );
}

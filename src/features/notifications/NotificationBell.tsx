import { useNavigate } from 'react-router-dom';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import Badge from '@mui/joy/Badge';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Dropdown from '@mui/joy/Dropdown';
import Menu from '@mui/joy/Menu';
import MenuButton from '@mui/joy/MenuButton';
import MenuItem from '@mui/joy/MenuItem';
import Typography from '@mui/joy/Typography';
import { timeAgo } from '../../utils/format';
import { useGetNotificationsQuery, useMarkNotificationsReadMutation } from './notificationsApi';

/** Polls every 15s. A socket connection would replace this once a real backend exists. */
export function NotificationBell() {
  const navigate = useNavigate();
  const { data = [] } = useGetNotificationsQuery(undefined, { pollingInterval: 15_000 });
  const [markRead] = useMarkNotificationsReadMutation();
  const unread = data.filter((n) => !n.read).length;
  const recent = data.slice(0, 8);

  return (
    <Dropdown>
      <MenuButton
        slots={{ root: 'button' }}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        style={{ background: 'none', border: 0, cursor: 'pointer', padding: 4, color: 'inherit', display: 'flex' }}
      >
        <Badge badgeContent={unread} size="sm" color="danger" invisible={unread === 0}>
          <NotificationsRounded />
        </Badge>
      </MenuButton>
      <Menu placement="bottom-end" size="sm" sx={{ width: 340, maxHeight: 440, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.5, py: 0.5 }}>
          <Typography level="title-sm">Notifications</Typography>
          <Button size="sm" variant="plain" disabled={unread === 0} onClick={() => void markRead()}>Mark all read</Button>
        </Box>
        {recent.length === 0 && <Typography level="body-sm" sx={{ p: 2, textAlign: 'center' }}>You are all caught up.</Typography>}
        {recent.map((n) => (
          <MenuItem
            key={n.id}
            onClick={() => {
              if (!n.read) void markRead(n.id);
              if (n.link) navigate(n.link);
            }}
            sx={{ alignItems: 'flex-start', gap: 1, fontWeight: n.read ? 400 : 600 }}
          >
            <Box sx={{ width: 8, height: 8, mt: 0.75, borderRadius: '50%', flexShrink: 0, bgcolor: n.read ? 'transparent' : 'primary.500' }} />
            <Box>
              <Typography level="body-sm" sx={{ fontWeight: 'inherit' }}>{n.message}</Typography>
              <Typography level="body-xs">{timeAgo(n.createdAt)}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
}

import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import type { User } from '../types';
import { initials } from '../utils/format';

interface Props {
  user?: User | null;
  size?: 'sm' | 'md';
  showName?: boolean;
}

export function UserAvatar({ user, size = 'sm', showName = false }: Props) {
  const avatar = (
    <Avatar size={size} variant="soft" color={user ? 'primary' : 'neutral'} title={user?.name ?? 'Unassigned'}>
      {user ? initials(user.name) : '?'}
    </Avatar>
  );
  if (!showName) return avatar;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {avatar}
      <Typography level="body-sm">{user?.name ?? 'Unassigned'}</Typography>
    </Box>
  );
}

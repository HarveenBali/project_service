import type { ReactNode } from 'react';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import type { ChipColor } from '../../constants';

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  color?: ChipColor;
  onClick?: () => void;
}

export function StatCard({ label, value, hint, icon, color = 'primary', onClick }: Props) {
  const interactive = !!onClick;
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      sx={{
        cursor: interactive ? 'pointer' : 'default',
        transition: 'box-shadow .15s, transform .15s',
        '&:hover': interactive ? { boxShadow: 'md', transform: 'translateY(-1px)' } : undefined,
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.500' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography level="body-sm">{label}</Typography>
          <Typography level="h2">{value}</Typography>
          {hint && <Typography level="body-xs">{hint}</Typography>}
        </Box>
        {icon && (
          <Box sx={{ p: 1, borderRadius: 'md', display: 'flex', bgcolor: `${color}.softBg`, color: `${color}.softColor` }} aria-hidden>
            {icon}
          </Box>
        )}
      </Box>
    </Card>
  );
}

import type { ReactNode } from 'react';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Box from '@mui/joy/Box';
import type { ChipColor } from '../constants';

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  color?: ChipColor;
  onClick?: () => void;
}

export function StatCard({ label, value, hint, icon, color = 'primary', onClick }: Props) {
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{ cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { boxShadow: 'md' } : undefined }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography level="body-sm">{label}</Typography>
          <Typography level="h2">{value}</Typography>
          {hint && <Typography level="body-xs">{hint}</Typography>}
        </Box>
        {icon && (
          <Box
            sx={{
              p: 1,
              borderRadius: 'md',
              display: 'flex',
              bgcolor: `${color}.softBg`,
              color: `${color}.softColor`,
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </Card>
  );
}

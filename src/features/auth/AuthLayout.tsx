import type { ReactNode } from 'react';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import { APP_NAME, APP_TAGLINE } from '../../constants';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background: (theme) =>
          `radial-gradient(circle at 20% 10%, ${theme.vars.palette.primary.softBg}, transparent 55%), ${theme.vars.palette.background.body}`,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography level="h2" sx={{ color: 'primary.500' }}>{APP_NAME}</Typography>
          <Typography level="body-sm">{APP_TAGLINE}</Typography>
        </Box>
        <Card variant="outlined" sx={{ p: 3, gap: 2, boxShadow: 'md' }}>
          <Box>
            <Typography level="h3" component="h1">{title}</Typography>
            {subtitle && <Typography level="body-sm">{subtitle}</Typography>}
          </Box>
          {children}
        </Card>
      </Box>
    </Box>
  );
}

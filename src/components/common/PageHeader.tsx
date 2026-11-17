import type { ReactNode } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';

interface Props {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
      <Box>
        <Typography level="h2" component="h1">{title}</Typography>
        {subtitle && <Typography level="body-sm" component="div">{subtitle}</Typography>}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  );
}

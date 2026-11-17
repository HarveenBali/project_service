import type { ReactNode } from 'react';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import Skeleton from '@mui/joy/Skeleton';
import Typography from '@mui/joy/Typography';
import Grid from '@mui/joy/Grid';

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <Typography level="title-lg">{title}</Typography>
      {description && <Typography level="body-sm" sx={{ mt: 0.5, mb: 2 }}>{description}</Typography>}
      {action}
    </Box>
  );
}

export function ErrorState({ message = 'We could not load this data.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <Alert
      color="danger"
      variant="soft"
      role="alert"
      endDecorator={onRetry && <Button size="sm" variant="solid" color="danger" onClick={onRetry}>Retry</Button>}
    >
      {message}
    </Alert>
  );
}

/** Placeholder with the same grid as the dashboards, so the layout does not jump on load. */
export function DashboardSkeleton() {
  return (
    <Box aria-busy="true" aria-label="Loading">
      <Skeleton variant="text" level="h2" sx={{ width: 240, mb: 3 }} />
      <Grid container spacing={2}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} xs={12} sm={6} lg={3}>
            <Card variant="outlined"><Skeleton variant="text" width="40%" /><Skeleton variant="text" level="h2" width="30%" /></Card>
          </Grid>
        ))}
        {[0, 1].map((i) => (
          <Grid key={i} xs={12} lg={i ? 5 : 7}>
            <Card variant="outlined" sx={{ height: 320 }}><Skeleton variant="rectangular" sx={{ height: '100%' }} /></Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Grid container spacing={2} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Grid key={i} xs={12} md={6} xl={4}>
          <Card variant="outlined" sx={{ height: 180 }}>
            <Skeleton variant="text" level="title-lg" width="60%" />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="40%" />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function BoardSkeleton() {
  return (
    <Box aria-busy="true" aria-label="Loading" sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(250px, 1fr))', gap: 2, overflowX: 'auto' }}>
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} variant="soft" sx={{ height: 360 }}><Skeleton variant="rectangular" sx={{ height: '100%' }} /></Card>
      ))}
    </Box>
  );
}

import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import Skeleton from '@mui/joy/Skeleton';
import Typography from '@mui/joy/Typography';
import { UserAvatar } from '../../components/common/UserAvatar';
import { ErrorState } from '../../components/feedback/Feedback';
import { useScopedData } from '../../hooks/useScopedData';
import { timeAgo } from '../../utils/format';
import { useGetActivityQuery } from '../notifications/notificationsApi';

/** Recent activity, limited to projects the current user can see (or their own actions). */
export function ActivityFeed({ projectId, limit = 8, title = 'Recent activity' }: { projectId?: string; limit?: number; title?: string }) {
  const { user, userById, projects } = useScopedData();
  const { data = [], isLoading, isError, refetch } = useGetActivityQuery(100, { pollingInterval: 30_000 });

  const visible = (() => {
    const ids = new Set(projects.map((p) => p.id));
    return data
      .filter((a) => (projectId ? a.projectId === projectId : user.role === 'admin' || a.actorId === user.id || (a.projectId && ids.has(a.projectId))))
      .slice(0, limit);
  })();

  return (
    <Card variant="outlined" component="section" aria-label={title} sx={{ height: '100%' }}>
      <Typography level="title-md" component="h2">{title}</Typography>
      {isError && <ErrorState message="Could not load activity." onRetry={() => void refetch()} />}
      {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} variant="text" />)}
      {!isLoading && !isError && visible.length === 0 && <Typography level="body-sm">Nothing has happened yet.</Typography>}
      <List size="sm" sx={{ '--ListItem-paddingX': 0, gap: 0.5 }}>
        {visible.map((a) => (
          <ListItem key={a.id} sx={{ alignItems: 'flex-start', gap: 1 }}>
            <UserAvatar user={userById.get(a.actorId)} />
            <Box>
              <Typography level="body-sm">
                <b>{userById.get(a.actorId)?.name ?? 'Someone'}</b> {a.message}
              </Typography>
              <Typography level="body-xs">{timeAgo(a.createdAt)}</Typography>
            </Box>
          </ListItem>
        ))}
      </List>
    </Card>
  );
}

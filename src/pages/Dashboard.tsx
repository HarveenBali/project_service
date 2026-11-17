import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AssignmentLateRounded from '@mui/icons-material/AssignmentLateRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';
import RateReviewRounded from '@mui/icons-material/RateReviewRounded';
import PlayCircleRounded from '@mui/icons-material/PlayCircleRounded';
import EventRounded from '@mui/icons-material/EventRounded';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import CircularProgress from '@mui/joy/CircularProgress';
import Grid from '@mui/joy/Grid';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemContent from '@mui/joy/ListItemContent';
import Typography from '@mui/joy/Typography';
import { ChartCard, DonutChart, ProgressList, WorkloadChart } from '../components/charts';
import { PriorityChip } from '../components/Chips';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { useScopedData } from '../hooks/useScopedData';
import { useAppDispatch } from '../store';
import { patchFilters, resetFilters } from '../store/taskFiltersSlice';
import type { Task, TaskStatus } from '../types';
import { projectProgress, statusCounts, summary, workloadByUser } from '../utils/analytics';
import { formatDate, isOverdue } from '../utils/format';
import { ROLE_LABEL } from '../constants';

function TaskMiniList({ title, tasks, empty, projectName, onOpen }: { title: string; tasks: Task[]; empty: string; projectName: (id: string) => string; onOpen: (t: Task) => void }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <Typography level="title-md">{title}</Typography>
      {tasks.length === 0 ? (
        <Typography level="body-sm">{empty}</Typography>
      ) : (
        <List size="sm" sx={{ '--ListItem-paddingX': 0 }}>
          {tasks.map((t) => (
            <ListItem key={t.id} onClick={() => onOpen(t)} sx={{ cursor: 'pointer', gap: 1 }}>
              <ListItemContent>
                <Typography level="title-sm">{t.title}</Typography>
                <Typography level="body-xs" color={isOverdue(t) ? 'danger' : 'neutral'}>
                  {projectName(t.projectId)} · {isOverdue(t) ? 'Overdue ' : 'Due '}
                  {formatDate(t.dueDate)}
                </Typography>
              </ListItemContent>
              <PriorityChip priority={t.priority} />
            </ListItem>
          ))}
        </List>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { user, users, projects, tasks, projectById, isLoading } = useScopedData();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const stats = useMemo(() => summary(tasks), [tasks]);
  const byStatus = useMemo(() => statusCounts(tasks), [tasks]);
  const progress = useMemo(() => projectProgress(projects, tasks), [projects, tasks]);
  const workload = useMemo(() => workloadByUser(tasks, users), [tasks, users]);
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const inReview = useMemo(() => tasks.filter((t) => t.status === 'review'), [tasks]);
  const upcoming = useMemo(
    () => tasks.filter((t) => t.status !== 'done').sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6),
    [tasks],
  );

  if (isLoading) return <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box>;

  const projectName = (id: string) => projectById.get(id)?.name ?? 'Unknown project';
  const goTasks = (filters: Parameters<typeof patchFilters>[0] = {}) => {
    dispatch(resetFilters());
    dispatch(patchFilters(filters));
    navigate('/tasks');
  };
  const sliceClick = (key: string) => goTasks({ statuses: [key as TaskStatus] });
  const openTask = () => goTasks();

  const subtitle = {
    admin: 'Organisation-wide overview of every project and team member.',
    manager: 'Progress across the projects you own or belong to.',
    member: 'Your assigned work at a glance.',
  }[user.role];

  return (
    <>
      <PageHeader title={`${ROLE_LABEL[user.role]} dashboard`} subtitle={subtitle} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {user.role === 'member' ? (
          <>
            <Grid xs={12} sm={6} lg={3}><StatCard label="My open tasks" value={stats.open} icon={<AssignmentLateRounded />} onClick={() => goTasks()} /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="In progress" value={tasks.filter((t) => t.status === 'in_progress').length} icon={<PlayCircleRounded />} color="primary" onClick={() => goTasks({ statuses: ['in_progress'] })} /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="Overdue" value={stats.overdue} icon={<EventRounded />} color="danger" /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="Completed" value={stats.done} hint={`${stats.completionRate}% of my tasks`} icon={<CheckCircleRounded />} color="success" onClick={() => goTasks({ statuses: ['done'] })} /></Grid>
          </>
        ) : (
          <>
            <Grid xs={12} sm={6} lg={3}><StatCard label={user.role === 'admin' ? 'Projects' : 'My projects'} value={projects.length} hint={`${activeProjects} active`} icon={<FolderRounded />} onClick={() => navigate('/projects')} /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="Open tasks" value={stats.open} hint={`${stats.total} total`} icon={<AssignmentLateRounded />} onClick={() => goTasks()} /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="Awaiting review" value={inReview.length} icon={<RateReviewRounded />} color="warning" onClick={() => goTasks({ statuses: ['review'] })} /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="Overdue" value={stats.overdue} icon={<EventRounded />} color="danger" /></Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={2}>
        {user.role === 'member' ? (
          <>
            <Grid xs={12} lg={7}><TaskMiniList title="Upcoming deadlines" tasks={upcoming} empty="You have no open tasks." projectName={projectName} onOpen={openTask} /></Grid>
            <Grid xs={12} lg={5}><ChartCard title="My tasks by status"><DonutChart data={byStatus} onSliceClick={sliceClick} /></ChartCard></Grid>
          </>
        ) : (
          <>
            <Grid xs={12} lg={7}><ChartCard title="Team workload" subtitle="Tasks per person, split by status"><WorkloadChart data={workload} /></ChartCard></Grid>
            <Grid xs={12} lg={5}><ChartCard title="Tasks by status" subtitle="Click a slice to see those tasks"><DonutChart data={byStatus} onSliceClick={sliceClick} /></ChartCard></Grid>
            <Grid xs={12} lg={7}><ChartCard title="Project progress" height={240}><ProgressList rows={progress} onSelect={(id) => navigate(`/projects/${id}`)} /></ChartCard></Grid>
            <Grid xs={12} lg={5}><TaskMiniList title={user.role === 'manager' ? 'Needs your review' : 'Next deadlines'} tasks={(user.role === 'manager' ? inReview : upcoming).slice(0, 5)} empty="Nothing waiting." projectName={projectName} onOpen={openTask} /></Grid>
          </>
        )}
      </Grid>
    </>
  );
}

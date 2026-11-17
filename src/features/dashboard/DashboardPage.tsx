import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AssignmentLateRounded from '@mui/icons-material/AssignmentLateRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import EventRounded from '@mui/icons-material/EventRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';
import PlayCircleRounded from '@mui/icons-material/PlayCircleRounded';
import RateReviewRounded from '@mui/icons-material/RateReviewRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Checkbox from '@mui/joy/Checkbox';
import Dropdown from '@mui/joy/Dropdown';
import Grid from '@mui/joy/Grid';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemContent from '@mui/joy/ListItemContent';
import Menu from '@mui/joy/Menu';
import MenuButton from '@mui/joy/MenuButton';
import Typography from '@mui/joy/Typography';
import { useAppDispatch } from '../../app/hooks';
import { PriorityChip } from '../../components/common/Chips';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { ChartCard, DonutChart, ProgressList, TrendChart, WorkloadChart } from '../../components/charts/charts';
import { DashboardSkeleton, ErrorState } from '../../components/feedback/Feedback';
import { ROLE_LABEL } from '../../constants';
import { useLocalPreferences } from '../../hooks/useLocalPreferences';
import { useScopedData } from '../../hooks/useScopedData';
import type { Task, TaskFilters, TaskStatus } from '../../types';
import { formatDate, isOverdue } from '../../utils/format';
import { projectHealth } from '../projects/health';
import { HealthBadge } from '../projects/HealthBadge';
import { projectProgress, statusCounts, summary, weeklyTrend, workloadByUser } from '../reports/analytics';
import { patchFilters, resetFilters } from '../tasks/taskFiltersSlice';
import { ActivityFeed } from './ActivityFeed';

type WidgetId = 'workload' | 'status' | 'trend' | 'progress' | 'attention' | 'health' | 'activity';
const WIDGETS: { id: WidgetId; label: string; roles: ('admin' | 'manager' | 'member')[] }[] = [
  { id: 'workload', label: 'Team workload', roles: ['admin', 'manager'] },
  { id: 'status', label: 'Tasks by status', roles: ['admin', 'manager', 'member'] },
  { id: 'trend', label: 'Productivity trend', roles: ['admin', 'manager', 'member'] },
  { id: 'progress', label: 'Project progress', roles: ['admin', 'manager'] },
  { id: 'health', label: 'Project health', roles: ['admin', 'manager'] },
  { id: 'attention', label: 'Needs attention', roles: ['admin', 'manager', 'member'] },
  { id: 'activity', label: 'Recent activity', roles: ['admin', 'manager', 'member'] },
];

function TaskMiniList({ title, tasks, empty, projectName, onOpen }: { title: string; tasks: Task[]; empty: string; projectName: (id: string) => string; onOpen: (t: Task) => void }) {
  return (
    <Card variant="outlined" component="section" aria-label={title} sx={{ height: '100%' }}>
      <Typography level="title-md" component="h2">{title}</Typography>
      {tasks.length === 0 ? (
        <Typography level="body-sm">{empty}</Typography>
      ) : (
        <List size="sm" sx={{ '--ListItem-paddingX': 0 }}>
          {tasks.map((t) => (
            <ListItem key={t.id} onClick={() => onOpen(t)} onKeyDown={(e) => e.key === 'Enter' && onOpen(t)} tabIndex={0} role="link" sx={{ cursor: 'pointer', gap: 1 }}>
              <ListItemContent>
                <Typography level="title-sm">{t.title}</Typography>
                <Typography level="body-xs" color={isOverdue(t) ? 'danger' : 'neutral'}>
                  {projectName(t.projectId)} · {isOverdue(t) ? 'Overdue ' : 'Due '}{formatDate(t.dueDate)}
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

export default function DashboardPage() {
  const { user, users, projects, tasks, projectById, isLoading, isError, refetch } = useScopedData();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [hidden, setHidden] = useLocalPreferences<WidgetId[]>(`flowsync-hidden-widgets-${user.id}`, []);

  const stats = useMemo(() => summary(tasks), [tasks]);
  const byStatus = useMemo(() => statusCounts(tasks), [tasks]);
  const progress = useMemo(() => projectProgress(projects, tasks), [projects, tasks]);
  const workload = useMemo(() => workloadByUser(tasks, users), [tasks, users]);
  const trend = useMemo(() => weeklyTrend(tasks, 8), [tasks]);
  const healthRows = useMemo(
    () => projects.map((p) => ({ project: p, health: projectHealth(p, tasks) })).sort((a, b) => a.health.score - b.health.score),
    [projects, tasks],
  );
  const attention = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'done');
    const list = user.role === 'manager' ? open.filter((t) => t.status === 'review' || isOverdue(t)) : open;
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);
  }, [tasks, user.role]);

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading) return <DashboardSkeleton />;

  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const inReview = tasks.filter((t) => t.status === 'review').length;
  const projectName = (id: string) => projectById.get(id)?.name ?? 'Unknown project';
  const goTasks = (filters: Partial<TaskFilters> = {}) => {
    dispatch(resetFilters());
    dispatch(patchFilters(filters));
    navigate('/tasks');
  };
  const visible = (id: WidgetId) => WIDGETS.find((w) => w.id === id)?.roles.includes(user.role) && !hidden.includes(id);
  const sliceClick = (key: string) => goTasks({ statuses: [key as TaskStatus] });

  const subtitle = {
    admin: 'Organisation-wide overview of every project and team member.',
    manager: 'Delivery across the projects you own or belong to.',
    member: 'Your assigned work at a glance.',
  }[user.role];

  return (
    <>
      <PageHeader
        title={`${ROLE_LABEL[user.role]} dashboard`}
        subtitle={subtitle}
        actions={
          <Dropdown>
            <MenuButton size="sm" variant="outlined" color="neutral" startDecorator={<TuneRounded />}>Customize</MenuButton>
            <Menu size="sm" placement="bottom-end">
              <Typography level="body-xs" sx={{ px: 1.5, py: 0.5 }}>Show widgets</Typography>
              {WIDGETS.filter((w) => w.roles.includes(user.role)).map((w) => (
                <ListItem key={w.id} sx={{ px: 1.5 }}>
                  <Checkbox size="sm" label={w.label} checked={!hidden.includes(w.id)} onChange={(e) => setHidden((h) => (e.target.checked ? h.filter((x) => x !== w.id) : [...h, w.id]))} />
                </ListItem>
              ))}
            </Menu>
          </Dropdown>
        }
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {user.role === 'member' ? (
          <>
            <Grid xs={12} sm={6} lg={3}><StatCard label="My open tasks" value={stats.open} icon={<AssignmentLateRounded />} onClick={() => goTasks()} /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="In progress" value={tasks.filter((t) => t.status === 'in_progress').length} icon={<PlayCircleRounded />} onClick={() => goTasks({ statuses: ['in_progress'] })} /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="Overdue" value={stats.overdue} icon={<EventRounded />} color="danger" /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="Completed" value={stats.done} hint={`${stats.completionRate}% of my tasks`} icon={<CheckCircleRounded />} color="success" onClick={() => goTasks({ statuses: ['done'] })} /></Grid>
          </>
        ) : (
          <>
            <Grid xs={12} sm={6} lg={3}><StatCard label="Active projects" value={activeProjects} hint={`${projects.length} total`} icon={<FolderRounded />} onClick={() => navigate('/projects')} /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="Open tasks" value={stats.open} hint={`${stats.completionRate}% complete`} icon={<AssignmentLateRounded />} onClick={() => goTasks()} /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="Awaiting review" value={inReview} icon={<RateReviewRounded />} color="warning" onClick={() => goTasks({ statuses: ['review'] })} /></Grid>
            <Grid xs={12} sm={6} lg={3}><StatCard label="Overdue" value={stats.overdue} icon={<EventRounded />} color="danger" /></Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={2}>
        {visible('workload') && <Grid xs={12} lg={7}><ChartCard title="Team workload" subtitle="Tasks per person, split by status"><WorkloadChart data={workload} /></ChartCard></Grid>}
        {visible('status') && <Grid xs={12} lg={5}><ChartCard title="Tasks by status" subtitle="Click a slice to see those tasks"><DonutChart data={byStatus} onSliceClick={sliceClick} /></ChartCard></Grid>}
        {visible('trend') && <Grid xs={12} lg={7}><ChartCard title="Productivity trend" subtitle="Created vs completed, last 8 weeks"><TrendChart data={trend} /></ChartCard></Grid>}
        {visible('attention') && (
          <Grid xs={12} lg={5}>
            <TaskMiniList title={user.role === 'manager' ? 'Needs your attention' : user.role === 'member' ? 'Upcoming deadlines' : 'Next deadlines'} tasks={attention} empty="Nothing waiting." projectName={projectName} onOpen={(t) => navigate(`/tasks?open=${t.id}`)} />
          </Grid>
        )}
        {visible('progress') && <Grid xs={12} lg={6}><ChartCard title="Project progress" height={240}><ProgressList rows={progress} onSelect={(id) => navigate(`/projects/${id}`)} /></ChartCard></Grid>}
        {visible('health') && (
          <Grid xs={12} lg={6}>
            <Card variant="outlined" component="section" aria-label="Project health" sx={{ height: '100%' }}>
              <Typography level="title-md" component="h2">Project health</Typography>
              <Typography level="body-xs">Lowest scores first. Hover a badge for the breakdown.</Typography>
              <List size="sm" sx={{ '--ListItem-paddingX': 0 }}>
                {healthRows.slice(0, 6).map(({ project, health }) => (
                  <ListItem key={project.id} sx={{ justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => navigate(`/projects/${project.id}`)}>
                    <Typography level="body-sm">{project.name}</Typography>
                    <HealthBadge health={health} />
                  </ListItem>
                ))}
                {healthRows.length === 0 && <Typography level="body-sm">No projects yet.</Typography>}
              </List>
            </Card>
          </Grid>
        )}
        {visible('activity') && <Grid xs={12}><Box><ActivityFeed /></Box></Grid>}
      </Grid>
    </>
  );
}

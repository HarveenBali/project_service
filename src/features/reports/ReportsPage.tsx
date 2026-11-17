import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import Button from '@mui/joy/Button';
import ButtonGroup from '@mui/joy/ButtonGroup';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Grid from '@mui/joy/Grid';
import { useAppDispatch } from '../../app/hooks';
import { ChartCard, DonutChart, ProgressList, SimpleBarChart, TrendChart, WorkloadChart } from '../../components/charts/charts';
import { FilterBar, SelectFilter } from '../../components/common/Filters';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { DashboardSkeleton, ErrorState } from '../../components/feedback/Feedback';
import { useScopedData } from '../../hooks/useScopedData';
import type { Priority, TaskStatus } from '../../types';
import { downloadCsv, toCsv } from '../../utils/csv';
import { patchFilters, resetFilters } from '../tasks/taskFiltersSlice';
import { priorityCounts, projectProgress, statusCounts, summary, weeklyTrend, workloadByUser } from './analytics';

const RANGES = [4, 8, 12] as const;

export default function ReportsPage() {
  const { projects, tasks, users, projectById, userById, isLoading, isError, refetch } = useScopedData();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [projectId, setProjectId] = useState('all');
  const [weeks, setWeeks] = useState<(typeof RANGES)[number]>(8);

  const scopedTasks = useMemo(() => (projectId === 'all' ? tasks : tasks.filter((t) => t.projectId === projectId)), [tasks, projectId]);
  const scopedProjects = useMemo(() => (projectId === 'all' ? projects : projects.filter((p) => p.id === projectId)), [projects, projectId]);
  const stats = useMemo(() => summary(scopedTasks), [scopedTasks]);
  const byStatus = useMemo(() => statusCounts(scopedTasks), [scopedTasks]);
  const byPriority = useMemo(() => priorityCounts(scopedTasks), [scopedTasks]);
  const trend = useMemo(() => weeklyTrend(scopedTasks, weeks), [scopedTasks, weeks]);
  const workload = useMemo(() => workloadByUser(scopedTasks, users), [scopedTasks, users]);
  const progress = useMemo(() => projectProgress(scopedProjects, scopedTasks), [scopedProjects, scopedTasks]);

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading) return <DashboardSkeleton />;

  /** Drill down: open the task grid pre-filtered to the clicked chart segment. */
  const drill = (filters: { statuses?: TaskStatus[]; priorities?: Priority[] }) => {
    dispatch(resetFilters());
    dispatch(patchFilters({ ...filters, projectId }));
    navigate('/tasks');
  };

  const exportCsv = () =>
    downloadCsv(
      'flowsync-report.csv',
      toCsv(
        ['Task', 'Project', 'Status', 'Priority', 'Assignee', 'Created', 'Due', 'Completed'],
        scopedTasks.map((t) => [t.title, projectById.get(t.projectId)?.name, t.status, t.priority, t.assigneeId ? userById.get(t.assigneeId)?.name : '', t.createdAt.slice(0, 10), t.dueDate.slice(0, 10), t.completedAt?.slice(0, 10) ?? '']),
      ),
    );

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Interactive charts. Click a status or priority to drill into the matching tasks."
        actions={<Button variant="outlined" color="neutral" startDecorator={<DownloadRounded />} onClick={exportCsv}>Export CSV</Button>}
      />
      <FilterBar>
        <SelectFilter label="Project" value={projectId} onChange={setProjectId} allLabel="All projects" options={projects.map((p) => ({ value: p.id, label: p.name }))} />
        <FormControl size="sm">
          <FormLabel>Trend range</FormLabel>
          <ButtonGroup size="sm" aria-label="Trend range">
            {RANGES.map((r) => (
              <Button key={r} variant={weeks === r ? 'solid' : 'outlined'} color={weeks === r ? 'primary' : 'neutral'} aria-pressed={weeks === r} onClick={() => setWeeks(r)}>{r} weeks</Button>
            ))}
          </ButtonGroup>
        </FormControl>
      </FilterBar>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid xs={6} lg={3}><StatCard label="Total tasks" value={stats.total} hint={`${stats.open} open`} /></Grid>
        <Grid xs={6} lg={3}><StatCard label="Completion rate" value={`${stats.completionRate}%`} color="success" /></Grid>
        <Grid xs={6} lg={3}><StatCard label="Overdue" value={stats.overdue} color="danger" /></Grid>
        <Grid xs={6} lg={3}><StatCard label="Avg. cycle time" value={`${stats.avgCycleDays}d`} hint="Created to done" color="warning" /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid xs={12} lg={8}><ChartCard title="Created vs completed" subtitle={`Last ${weeks} weeks`}><TrendChart data={trend} /></ChartCard></Grid>
        <Grid xs={12} lg={4}><ChartCard title="Status mix"><DonutChart data={byStatus} onSliceClick={(k) => drill({ statuses: [k as TaskStatus] })} /></ChartCard></Grid>
        <Grid xs={12} lg={6}><ChartCard title="Workload by person"><WorkloadChart data={workload} /></ChartCard></Grid>
        <Grid xs={12} lg={3}><ChartCard title="Priority mix"><DonutChart data={byPriority} onSliceClick={(k) => drill({ priorities: [k as Priority] })} /></ChartCard></Grid>
        <Grid xs={12} lg={3}><ChartCard title="Priority counts"><SimpleBarChart data={byPriority} /></ChartCard></Grid>
        <Grid xs={12}><ChartCard title="Project progress" height={Math.max(120, progress.length * 52)}><ProgressList rows={progress} onSelect={(id) => navigate(`/projects/${id}`)} /></ChartCard></Grid>
      </Grid>
    </>
  );
}

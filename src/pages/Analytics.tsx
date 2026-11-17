import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import ButtonGroup from '@mui/joy/ButtonGroup';
import CircularProgress from '@mui/joy/CircularProgress';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Grid from '@mui/joy/Grid';
import { ChartCard, DonutChart, ProgressList, SimpleBarChart, TrendChart, WorkloadChart } from '../components/charts';
import { FilterBar, SelectFilter } from '../components/Filters';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { useScopedData } from '../hooks/useScopedData';
import { useAppDispatch } from '../store';
import { patchFilters, resetFilters } from '../store/taskFiltersSlice';
import type { Priority, TaskStatus } from '../types';
import { priorityCounts, projectProgress, statusCounts, summary, weeklyTrend, workloadByUser } from '../utils/analytics';

const RANGES = [4, 8, 12] as const;

export default function Analytics() {
  const { projects, tasks, users, isLoading } = useScopedData();
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

  if (isLoading) return <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box>;

  /** Drill down: open the task table pre-filtered to the clicked chart segment. */
  const drill = (filters: { statuses?: TaskStatus[]; priorities?: Priority[] }) => {
    dispatch(resetFilters());
    dispatch(patchFilters({ ...filters, projectId }));
    navigate('/tasks');
  };

  return (
    <>
      <PageHeader title="Analytics" subtitle="Interactive charts. Click a status or priority to drill into the matching tasks." />
      <FilterBar>
        <SelectFilter label="Project" value={projectId} onChange={setProjectId} allLabel="All projects" options={projects.map((p) => ({ value: p.id, label: p.name }))} />
        <FormControl size="sm">
          <FormLabel>Trend range</FormLabel>
          <ButtonGroup size="sm" variant="outlined">
            {RANGES.map((r) => (
              <Button key={r} variant={weeks === r ? 'solid' : 'outlined'} color={weeks === r ? 'primary' : 'neutral'} onClick={() => setWeeks(r)}>
                {r} weeks
              </Button>
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
        <Grid xs={12} lg={3}>
          <ChartCard title="Priority">
            <DonutChart data={byPriority} onSliceClick={(k) => drill({ priorities: [k as Priority] })} />
          </ChartCard>
        </Grid>
        <Grid xs={12} lg={3}><ChartCard title="Priority (bars)"><SimpleBarChart data={byPriority} /></ChartCard></Grid>
        <Grid xs={12}><ChartCard title="Project progress" height={Math.max(120, progress.length * 52)}><ProgressList rows={progress} onSelect={(id) => navigate(`/projects/${id}`)} /></ChartCard></Grid>
      </Grid>
    </>
  );
}

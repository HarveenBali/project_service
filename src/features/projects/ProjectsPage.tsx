import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AddRounded from '@mui/icons-material/AddRounded';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import Grid from '@mui/joy/Grid';
import LinearProgress from '@mui/joy/LinearProgress';
import Typography from '@mui/joy/Typography';
import Pagination from '@mui/material/Pagination';
import { ProjectStatusChip } from '../../components/common/Chips';
import { FilterBar, SearchInput, SelectFilter } from '../../components/common/Filters';
import { PageHeader } from '../../components/common/PageHeader';
import { UserAvatar } from '../../components/common/UserAvatar';
import { CardGridSkeleton, EmptyState, ErrorState } from '../../components/feedback/Feedback';
import { PROJECT_STATUSES } from '../../constants';
import { useDebounce } from '../../hooks/useDebounce';
import { usePermissions } from '../../hooks/usePermissions';
import { useScopedData } from '../../hooks/useScopedData';
import { formatDate } from '../../utils/format';
import { projectProgress } from '../reports/analytics';
import { projectHealth } from './health';
import { HealthBadge } from './HealthBadge';
import { ProjectFormDialog } from './ProjectFormDialog';

type SortKey = 'name' | 'endDate' | 'progress' | 'health';
const PAGE_SIZE = 6;

export default function ProjectsPage() {
  const { projects, tasks, userById, isLoading, isError, refetch } = useScopedData();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const debounced = useDebounce(search);

  useEffect(() => {
    if (params.get('new') && can('project:create')) setCreating(true);
    if (params.get('new')) setParams({}, { replace: true });
  }, [params, setParams, can]);

  const progress = useMemo(() => new Map(projectProgress(projects, tasks).map((p) => [p.id, p])), [projects, tasks]);
  const health = useMemo(() => new Map(projects.map((p) => [p.id, projectHealth(p, tasks)])), [projects, tasks]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return projects
      .filter((p) => (status === 'all' || p.status === status) && (!q || `${p.name} ${p.description}`.toLowerCase().includes(q)))
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'endDate') return a.endDate.localeCompare(b.endDate);
        if (sort === 'health') return (health.get(a.id)?.score ?? 0) - (health.get(b.id)?.score ?? 0);
        return (progress.get(b.id)?.percent ?? 0) - (progress.get(a.id)?.percent ?? 0);
      });
  }, [projects, debounced, status, sort, progress, health]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Search, filter and open any project you can access."
        actions={can('project:create') && <Button startDecorator={<AddRounded />} onClick={() => setCreating(true)}>New project</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search projects" />
        <SelectFilter label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
        <SelectFilter
          label="Sort by"
          value={sort}
          onChange={(v) => setSort(v === 'all' ? 'name' : (v as SortKey))}
          allLabel="Name"
          options={[{ value: 'endDate', label: 'End date' }, { value: 'progress', label: 'Progress' }, { value: 'health', label: 'Health (worst first)' }]}
        />
      </FilterBar>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <CardGridSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={projects.length === 0 ? 'Projects you belong to will appear here.' : 'Try a different search or status filter.'}
          action={can('project:create') && projects.length === 0 ? <Button onClick={() => setCreating(true)}>Create your first project</Button> : undefined}
        />
      ) : (
        <Grid container spacing={2}>
          {visible.map((p) => {
            const prog = progress.get(p.id);
            const h = health.get(p.id);
            return (
              <Grid key={p.id} xs={12} md={6} xl={4}>
                <Card
                  variant="outlined"
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${p.id}`)}
                  sx={{ cursor: 'pointer', height: '100%', '&:hover': { boxShadow: 'md' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.500' } }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography level="title-lg" component="h2">{p.name}</Typography>
                    <ProjectStatusChip status={p.status} />
                  </Box>
                  <Typography level="body-sm" sx={{ flexGrow: 1 }}>{p.description}</Typography>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography level="body-xs">{prog?.done ?? 0}/{prog?.total ?? 0} tasks done</Typography>
                      <Typography level="body-xs">{prog?.percent ?? 0}%</Typography>
                    </Box>
                    <LinearProgress determinate value={prog?.percent ?? 0} color="success" sx={{ mt: 0.5 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <UserAvatar user={userById.get(p.ownerId)} showName />
                    {h && <HealthBadge health={h} />}
                  </Box>
                  <Typography level="body-xs">Ends {formatDate(p.endDate)}</Typography>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={pageCount} page={current} onChange={(_e, p) => setPage(p)} color="primary" />
        </Box>
      )}
      <ProjectFormDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

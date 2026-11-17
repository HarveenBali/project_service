import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddRounded from '@mui/icons-material/AddRounded';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import CircularProgress from '@mui/joy/CircularProgress';
import Grid from '@mui/joy/Grid';
import LinearProgress from '@mui/joy/LinearProgress';
import Typography from '@mui/joy/Typography';
import Pagination from '@mui/material/Pagination';
import { FilterBar, SearchInput, SelectFilter } from '../components/Filters';
import { PageHeader } from '../components/PageHeader';
import { ProjectFormDialog } from '../components/ProjectFormDialog';
import { ProjectStatusChip } from '../components/Chips';
import { UserAvatar } from '../components/UserAvatar';
import { PROJECT_STATUSES } from '../constants';
import { useScopedData } from '../hooks/useScopedData';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { ProjectStatus } from '../types';
import { projectProgress } from '../utils/analytics';
import { formatDate } from '../utils/format';
import { can } from '../utils/permissions';

type SortKey = 'name' | 'endDate' | 'progress';
const PAGE_SIZE = 6;

export default function Projects() {
  const { user, projects, tasks, userById, isLoading } = useScopedData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const debounced = useDebouncedValue(search);

  const progress = useMemo(() => new Map(projectProgress(projects, tasks).map((p) => [p.id, p])), [projects, tasks]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return projects
      .filter((p) => (status === 'all' || p.status === status) && (!q || `${p.name} ${p.description}`.toLowerCase().includes(q)))
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'endDate') return a.endDate.localeCompare(b.endDate);
        return (progress.get(b.id)?.percent ?? 0) - (progress.get(a.id)?.percent ?? 0);
      });
  }, [projects, debounced, status, sort, progress]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((Math.min(page, pageCount) - 1) * PAGE_SIZE, Math.min(page, pageCount) * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={user.role === 'member' ? 'Projects you are a member of.' : undefined}
        actions={can(user.role, 'project:create') && <Button startDecorator={<AddRounded />} onClick={() => setCreating(true)}>New project</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search projects" />
        <SelectFilter label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
        <SelectFilter
          label="Sort by"
          value={sort}
          onChange={(v) => setSort(v === 'all' ? 'name' : (v as SortKey))}
          allLabel="Name"
          options={[{ value: 'endDate', label: 'End date' }, { value: 'progress', label: 'Progress' }]}
        />
      </FilterBar>

      {isLoading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box>
      ) : visible.length === 0 ? (
        <Typography level="body-md" sx={{ py: 6, textAlign: 'center' }}>No projects found.</Typography>
      ) : (
        <Grid container spacing={2}>
          {visible.map((p) => {
            const prog = progress.get(p.id);
            return (
              <Grid key={p.id} xs={12} md={6} xl={4}>
                <Card variant="outlined" onClick={() => navigate(`/projects/${p.id}`)} sx={{ cursor: 'pointer', height: '100%', '&:hover': { boxShadow: 'md' } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography level="title-lg">{p.name}</Typography>
                    <ProjectStatusChip status={p.status as ProjectStatus} />
                  </Box>
                  <Typography level="body-sm" sx={{ flexGrow: 1 }}>{p.description}</Typography>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography level="body-xs">{prog?.done ?? 0}/{prog?.total ?? 0} tasks done</Typography>
                      <Typography level="body-xs">{prog?.percent ?? 0}%</Typography>
                    </Box>
                    <LinearProgress determinate value={prog?.percent ?? 0} color="success" sx={{ mt: 0.5 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <UserAvatar user={userById.get(p.ownerId)} showName />
                    <Typography level="body-xs">Ends {formatDate(p.endDate)}</Typography>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={pageCount} page={Math.min(page, pageCount)} onChange={(_e, p) => setPage(p)} color="primary" />
        </Box>
      )}

      <ProjectFormDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

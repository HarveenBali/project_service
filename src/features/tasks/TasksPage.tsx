import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddRounded from '@mui/icons-material/AddRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import type { GridColDef } from '@mui/x-data-grid';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { PriorityChip, StatusChip } from '../../components/common/Chips';
import { FilterBar, MultiSelectFilter, SearchInput, SelectFilter } from '../../components/common/Filters';
import { PageHeader } from '../../components/common/PageHeader';
import { UserAvatar } from '../../components/common/UserAvatar';
import { DataGridTable } from '../../components/data-grid/DataGridTable';
import { ErrorState } from '../../components/feedback/Feedback';
import { PRIORITIES, TASK_STATUSES } from '../../constants';
import { useDebounce } from '../../hooks/useDebounce';
import { usePermissions } from '../../hooks/usePermissions';
import { useScopedData } from '../../hooks/useScopedData';
import type { Task, TaskQuery, TaskSortKey } from '../../types';
import { downloadCsv, toCsv } from '../../utils/csv';
import { formatDate, isOverdue } from '../../utils/format';
import { TaskDrawer } from './TaskDrawer';
import { hasActiveFilters, patchFilters, resetFilters, setSort } from './taskFiltersSlice';
import { useGetTasksQuery, useSearchTasksQuery } from './tasksApi';

const SORTABLE: TaskSortKey[] = ['title', 'status', 'priority', 'dueDate'];

export default function TasksPage() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.taskFilters);
  const { user, users, projects, tasks: scopedTasks, userById, projectById, isLoading } = useScopedData();
  const { can } = usePermissions();
  const [params, setParams] = useSearchParams();
  const { data: allTasks = [] } = useGetTasksQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Deep links: /tasks?open=<id> opens a task, /tasks?new=1 opens the create drawer.
  useEffect(() => {
    const open = params.get('open');
    if (open) setSelectedId(open);
    if (params.get('new') && can('task:create')) setCreating(true);
    if (open || params.get('new')) setParams({}, { replace: true });
  }, [params, setParams, can]);

  // The search box is local so typing is instant; the store (and API) update after a pause.
  const [searchText, setSearchText] = useState(filters.search);
  const debounced = useDebounce(searchText, 300);
  useEffect(() => {
    if (debounced !== filters.search) dispatch(patchFilters({ search: debounced }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  useEffect(() => setSearchText(filters.search), [filters.search]);

  const query = useMemo<TaskQuery>(
    () => ({
      ...filters,
      scopeUserId: user.role === 'member' ? user.id : undefined,
      scopeProjectIds: user.role === 'manager' ? projects.map((p) => p.id) : undefined,
    }),
    [filters, user, projects],
  );
  const { data, isFetching, isError, refetch } = useSearchTasksQuery(query, { skip: isLoading });
  const selected = useMemo(() => allTasks.find((t) => t.id === selectedId), [allTasks, selectedId]);

  const columns = useMemo<GridColDef<Task>[]>(
    () => [
      { field: 'title', headerName: 'Task', flex: 1.4, minWidth: 200, sortable: true, renderCell: (p) => <Typography level="title-sm">{p.row.title}</Typography> },
      { field: 'project', headerName: 'Project', flex: 1, minWidth: 160, sortable: false, valueGetter: (_v, row) => projectById.get(row.projectId)?.name ?? '' },
      { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip status={p.row.status} /> },
      { field: 'priority', headerName: 'Priority', width: 120, renderCell: (p) => <PriorityChip priority={p.row.priority} /> },
      { field: 'assignee', headerName: 'Assignee', flex: 1, minWidth: 160, sortable: false, renderCell: (p) => <UserAvatar user={p.row.assigneeId ? userById.get(p.row.assigneeId) : null} showName /> },
      {
        field: 'dueDate', headerName: 'Due', width: 130,
        renderCell: (p) => <Typography level="body-sm" color={isOverdue(p.row) ? 'danger' : 'neutral'}>{formatDate(p.row.dueDate)}</Typography>,
      },
    ],
    [projectById, userById],
  );

  const assigneeOptions = useMemo(
    () => [{ value: 'unassigned', label: 'Unassigned' }, ...users.filter((u) => u.role !== 'admin').map((u) => ({ value: u.id, label: u.name }))],
    [users],
  );

  const exportCsv = () => {
    const rows = scopedTasks.map((t) => [
      t.title, projectById.get(t.projectId)?.name, t.status, t.priority, t.assigneeId ? userById.get(t.assigneeId)?.name : '', t.dueDate.slice(0, 10),
    ]);
    downloadCsv('tasks.csv', toCsv(['Title', 'Project', 'Status', 'Priority', 'Assignee', 'Due'], rows));
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle={user.role === 'member' ? 'Tasks assigned to you.' : 'Filter, sort and manage tasks across projects.'}
        actions={
          <>
            <Button variant="outlined" color="neutral" startDecorator={<DownloadRounded />} onClick={exportCsv}>Export CSV</Button>
            {can('task:create') && <Button startDecorator={<AddRounded />} onClick={() => setCreating(true)}>New task</Button>}
          </>
        }
      />
      <FilterBar>
        <SearchInput value={searchText} onChange={setSearchText} placeholder="Search title or description" />
        <MultiSelectFilter label="Status" value={filters.statuses} onChange={(statuses) => dispatch(patchFilters({ statuses }))} options={TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
        <MultiSelectFilter label="Priority" value={filters.priorities} onChange={(priorities) => dispatch(patchFilters({ priorities }))} options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} />
        <SelectFilter label="Project" value={filters.projectId} onChange={(projectId) => dispatch(patchFilters({ projectId }))} options={projects.map((p) => ({ value: p.id, label: p.name }))} />
        {user.role !== 'member' && (
          <SelectFilter label="Assignee" value={filters.assigneeId} onChange={(assigneeId) => dispatch(patchFilters({ assigneeId }))} options={assigneeOptions} />
        )}
        {hasActiveFilters(filters) && <Button size="sm" variant="plain" color="neutral" onClick={() => dispatch(resetFilters())}>Clear filters</Button>}
      </FilterBar>

      {isError ? (
        <ErrorState message="Could not load tasks." onRetry={() => void refetch()} />
      ) : (
        <DataGridTable<Task, TaskSortKey>
          ariaLabel="Tasks"
          columns={columns}
          rows={data?.items ?? []}
          total={data?.total ?? 0}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => dispatch(patchFilters({ page }))}
          onPageSizeChange={(pageSize) => dispatch(patchFilters({ pageSize }))}
          sortBy={filters.sortBy}
          sortDir={filters.sortDir}
          onSortChange={(s) => dispatch(setSort(s && SORTABLE.includes(s.sortBy) ? s : null))}
          onRowClick={(t) => setSelectedId(t.id)}
          loading={isFetching || isLoading}
        />
      )}

      <TaskDrawer open={!!selected} task={selected} onClose={() => setSelectedId(null)} />
      <TaskDrawer open={creating} defaultProjectId={filters.projectId === 'all' ? undefined : filters.projectId} onClose={() => setCreating(false)} />
    </>
  );
}

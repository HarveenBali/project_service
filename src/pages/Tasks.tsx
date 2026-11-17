import { useEffect, useMemo, useState } from 'react';
import AddRounded from '@mui/icons-material/AddRounded';
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';
import { PriorityChip, StatusChip } from '../components/Chips';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { FilterBar, MultiSelectFilter, SearchInput, SelectFilter } from '../components/Filters';
import { PageHeader } from '../components/PageHeader';
import { TaskFormDialog } from '../components/TaskFormDialog';
import { UserAvatar } from '../components/UserAvatar';
import { PRIORITIES, TASK_STATUSES } from '../constants';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useScopedData } from '../hooks/useScopedData';
import { useAppDispatch, useAppSelector } from '../store';
import { useSearchTasksQuery } from '../store/api';
import { hasActiveFilters, patchFilters, resetFilters, toggleSort } from '../store/taskFiltersSlice';
import type { Task, TaskQuery, TaskSortKey } from '../types';
import { formatDate, isOverdue } from '../utils/format';
import { can } from '../utils/permissions';

export default function Tasks() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.taskFilters);
  const { user, users, projects, userById, projectById, isLoading } = useScopedData();
  const [editing, setEditing] = useState<Task | undefined>();
  const [creating, setCreating] = useState(false);

  // The search box is local so typing is instant; the store (and API) update after a pause.
  const [searchText, setSearchText] = useState(filters.search);
  const debounced = useDebouncedValue(searchText, 300);
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
  const { data, isFetching } = useSearchTasksQuery(query, { skip: isLoading });

  const columns = useMemo<Column<Task, TaskSortKey>[]>(
    () => [
      { id: 'title', header: 'Task', sortKey: 'title', render: (t) => <Typography level="title-sm">{t.title}</Typography> },
      { id: 'project', header: 'Project', render: (t) => <Typography level="body-sm">{projectById.get(t.projectId)?.name}</Typography> },
      { id: 'status', header: 'Status', sortKey: 'status', render: (t) => <StatusChip status={t.status} /> },
      { id: 'priority', header: 'Priority', sortKey: 'priority', render: (t) => <PriorityChip priority={t.priority} /> },
      { id: 'assignee', header: 'Assignee', render: (t) => <UserAvatar user={t.assigneeId ? userById.get(t.assigneeId) : null} showName /> },
      {
        id: 'due',
        header: 'Due',
        sortKey: 'dueDate',
        render: (t) => (
          <Typography level="body-sm" color={isOverdue(t) ? 'danger' : 'neutral'}>
            {formatDate(t.dueDate)}
          </Typography>
        ),
      },
    ],
    [projectById, userById],
  );

  const assigneeOptions = useMemo(
    () => [{ value: 'unassigned', label: 'Unassigned' }, ...users.filter((u) => u.role !== 'admin').map((u) => ({ value: u.id, label: u.name }))],
    [users],
  );
  const projectOptions = useMemo(() => projects.map((p) => ({ value: p.id, label: p.name })), [projects]);

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle={user.role === 'member' ? 'Tasks assigned to you.' : 'Filter, sort and manage tasks across projects.'}
        actions={can(user.role, 'task:create') && <Button startDecorator={<AddRounded />} onClick={() => setCreating(true)}>New task</Button>}
      />

      <FilterBar>
        <SearchInput value={searchText} onChange={setSearchText} placeholder="Search title or description" />
        <MultiSelectFilter label="Status" value={filters.statuses} onChange={(statuses) => dispatch(patchFilters({ statuses }))} options={TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
        <MultiSelectFilter label="Priority" value={filters.priorities} onChange={(priorities) => dispatch(patchFilters({ priorities }))} options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} />
        <SelectFilter label="Project" value={filters.projectId} onChange={(projectId) => dispatch(patchFilters({ projectId }))} options={projectOptions} />
        {user.role !== 'member' && (
          <SelectFilter label="Assignee" value={filters.assigneeId} onChange={(assigneeId) => dispatch(patchFilters({ assigneeId }))} options={assigneeOptions} />
        )}
        {hasActiveFilters(filters) && (
          <Button size="sm" variant="plain" color="neutral" onClick={() => dispatch(resetFilters())}>
            Clear filters
          </Button>
        )}
      </FilterBar>

      <DataTable<Task, TaskSortKey>
        columns={columns}
        rows={data?.items ?? []}
        getRowId={(t) => t.id}
        total={data?.total ?? 0}
        page={filters.page}
        pageSize={filters.pageSize}
        onPageChange={(page) => dispatch(patchFilters({ page }))}
        onPageSizeChange={(pageSize) => dispatch(patchFilters({ pageSize }))}
        sortBy={filters.sortBy}
        sortDir={filters.sortDir}
        onSort={(key) => dispatch(toggleSort(key))}
        onRowClick={setEditing}
        loading={isFetching || isLoading}
      />

      <TaskFormDialog open={!!editing} task={editing} onClose={() => setEditing(undefined)} />
      <TaskFormDialog open={creating} defaultProjectId={filters.projectId === 'all' ? undefined : filters.projectId} onClose={() => setCreating(false)} />
    </>
  );
}

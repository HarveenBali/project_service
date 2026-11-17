import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import CircularProgress from '@mui/joy/CircularProgress';
import LinearProgress from '@mui/joy/LinearProgress';
import Link from '@mui/joy/Link';
import Typography from '@mui/joy/Typography';
import { FilterBar, MultiSelectFilter, SearchInput, SelectFilter } from '../components/Filters';
import { KanbanBoard } from '../components/KanbanBoard';
import { PageHeader } from '../components/PageHeader';
import { ProjectFormDialog } from '../components/ProjectFormDialog';
import { ProjectStatusChip } from '../components/Chips';
import { TaskFormDialog } from '../components/TaskFormDialog';
import { PRIORITIES } from '../constants';
import { useScopedData } from '../hooks/useScopedData';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useGetTasksQuery } from '../store/api';
import type { Priority, Task, TaskStatus } from '../types';
import { formatDate } from '../utils/format';
import { can, canWorkOnTask } from '../utils/permissions';

export default function ProjectDetail() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const { user, users, userById, projectById, isLoading } = useScopedData();
  // Per-project cache entry: the board is patched optimistically on drag-and-drop.
  const { data: tasks = [], isLoading: tasksLoading } = useGetTasksQuery(projectId);

  const [search, setSearch] = useState('');
  const [assignee, setAssignee] = useState('all');
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [editing, setEditing] = useState<Task | undefined>();
  const [adding, setAdding] = useState<TaskStatus | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const debounced = useDebouncedValue(search);

  const project = projectById.get(projectId);
  const hasAccess = !!project && (user.role === 'admin' || project.ownerId === user.id || project.memberIds.includes(user.id));

  const team = useMemo(() => {
    if (!project) return [];
    const ids = new Set([project.ownerId, ...project.memberIds]);
    return users.filter((u) => ids.has(u.id));
  }, [project, users]);

  const filtersActive = debounced !== '' || assignee !== 'all' || priorities.length > 0;
  const visible = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (!q || t.title.toLowerCase().includes(q)) &&
        (assignee === 'all' || (assignee === 'unassigned' ? t.assigneeId === null : t.assigneeId === assignee)) &&
        (priorities.length === 0 || priorities.includes(t.priority)),
    );
  }, [tasks, debounced, assignee, priorities]);

  const done = tasks.filter((t) => t.status === 'done').length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  if (isLoading || tasksLoading) return <Box sx={{ display: 'grid', placeItems: 'center', py: 10 }}><CircularProgress /></Box>;
  if (!project || !hasAccess) return <Alert color="warning">Project not found, or you do not have access to it.</Alert>;

  return (
    <>
      <Link component={RouterLink} to="/projects" level="body-sm" sx={{ mb: 1, display: 'inline-block' }}>
        ← All projects
      </Link>
      <PageHeader
        title={project.name}
        subtitle={
          <Box component="span" sx={{ display: 'inline-flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <ProjectStatusChip status={project.status} />
            {formatDate(project.startDate)} – {formatDate(project.endDate)} · Owner: {userById.get(project.ownerId)?.name}
          </Box>
        }
        actions={
          <>
            {can(user.role, 'project:edit') && (
              <Button variant="outlined" color="neutral" startDecorator={<EditRounded />} onClick={() => setEditingProject(true)}>Edit</Button>
            )}
            {can(user.role, 'task:create') && (
              <Button startDecorator={<AddRounded />} onClick={() => setAdding('todo')}>Add task</Button>
            )}
          </>
        }
      />
      <Box sx={{ mb: 2, maxWidth: 480 }}>
        <Typography level="body-xs">{done}/{tasks.length} tasks done · {percent}%</Typography>
        <LinearProgress determinate value={percent} color="success" sx={{ mt: 0.5 }} />
      </Box>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search tasks" />
        <SelectFilter label="Assignee" value={assignee} onChange={setAssignee} options={[{ value: 'unassigned', label: 'Unassigned' }, ...team.map((u) => ({ value: u.id, label: u.name }))]} />
        <MultiSelectFilter label="Priority" value={priorities} onChange={setPriorities} options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} />
      </FilterBar>
      {filtersActive && (
        <Typography level="body-xs" sx={{ mb: 1 }}>Drag-and-drop is paused while filters are active.</Typography>
      )}

      <KanbanBoard
        projectId={project.id}
        tasks={visible}
        userById={userById}
        dragDisabled={filtersActive}
        canDrag={(t) => canWorkOnTask(user, t)}
        onOpenTask={setEditing}
        onAddTask={can(user.role, 'task:create') ? setAdding : undefined}
      />

      <TaskFormDialog open={!!editing} task={editing} onClose={() => setEditing(undefined)} />
      <TaskFormDialog open={adding !== null} defaultProjectId={project.id} defaultStatus={adding ?? 'todo'} onClose={() => setAdding(null)} />
      <ProjectFormDialog open={editingProject} project={project} onClose={() => setEditingProject(false)} onDeleted={() => navigate('/projects')} />
    </>
  );
}

import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import AddRounded from '@mui/icons-material/AddRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import Grid from '@mui/joy/Grid';
import LinearProgress from '@mui/joy/LinearProgress';
import Link from '@mui/joy/Link';
import Tab from '@mui/joy/Tab';
import TabList from '@mui/joy/TabList';
import TabPanel from '@mui/joy/TabPanel';
import Tabs from '@mui/joy/Tabs';
import Typography from '@mui/joy/Typography';
import { ProjectStatusChip } from '../../components/common/Chips';
import { FilterBar, MultiSelectFilter, SearchInput, SelectFilter } from '../../components/common/Filters';
import { PageHeader } from '../../components/common/PageHeader';
import { UserAvatar } from '../../components/common/UserAvatar';
import { BoardSkeleton, ErrorState } from '../../components/feedback/Feedback';
import { PRIORITIES } from '../../constants';
import { useDebounce } from '../../hooks/useDebounce';
import { usePermissions } from '../../hooks/usePermissions';
import { useScopedData } from '../../hooks/useScopedData';
import type { Priority, Task, TaskStatus } from '../../types';
import { formatDate } from '../../utils/format';
import { ActivityFeed } from '../dashboard/ActivityFeed';
import { KanbanBoard } from '../kanban/KanbanBoard';
import { TaskDrawer } from '../tasks/TaskDrawer';
import { useGetTasksQuery } from '../tasks/tasksApi';
import { projectHealth } from './health';
import { HealthBadge } from './HealthBadge';
import { ProjectFormDialog } from './ProjectFormDialog';

export default function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const { user, users, userById, projectById, isLoading } = useScopedData();
  const { can, canWorkOn } = usePermissions();
  // Per-project cache entry: the board is patched optimistically on drag-and-drop.
  const { data: tasks = [], isLoading: tasksLoading, isError, refetch } = useGetTasksQuery(projectId);

  const [search, setSearch] = useState('');
  const [assignee, setAssignee] = useState('all');
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState<TaskStatus | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const debounced = useDebounce(search);

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

  const health = useMemo(() => (project ? projectHealth(project, tasks) : null), [project, tasks]);
  const selected: Task | undefined = useMemo(() => tasks.find((t) => t.id === selectedId), [tasks, selectedId]);
  const done = tasks.filter((t) => t.status === 'done').length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  if (isLoading || tasksLoading) return <BoardSkeleton />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!project || !hasAccess) return <Alert color="warning">Project not found, or you do not have access to it.</Alert>;

  return (
    <>
      <Link component={RouterLink} to="/projects" level="body-sm" sx={{ mb: 1, display: 'inline-block' }}>← All projects</Link>
      <PageHeader
        title={project.name}
        subtitle={
          <Box component="span" sx={{ display: 'inline-flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <ProjectStatusChip status={project.status} />
            {health && <HealthBadge health={health} />}
            {formatDate(project.startDate)} – {formatDate(project.endDate)}
          </Box>
        }
        actions={
          <>
            {can('project:edit') && <Button variant="outlined" color="neutral" startDecorator={<EditRounded />} onClick={() => setEditingProject(true)}>Edit</Button>}
            {can('task:create') && <Button startDecorator={<AddRounded />} onClick={() => setAdding('todo')}>Add task</Button>}
          </>
        }
      />
      <Box sx={{ mb: 2, maxWidth: 480 }}>
        <Typography level="body-xs">{done}/{tasks.length} tasks done · {percent}%</Typography>
        <LinearProgress determinate value={percent} color="success" sx={{ mt: 0.5 }} />
      </Box>

      <Tabs defaultValue="board" sx={{ bgcolor: 'transparent' }}>
        <TabList sx={{ mb: 2 }}>
          <Tab value="board">Board</Tab>
          <Tab value="overview">Overview</Tab>
        </TabList>

        <TabPanel value="board" sx={{ p: 0 }}>
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search tasks" />
            <SelectFilter label="Assignee" value={assignee} onChange={setAssignee} options={[{ value: 'unassigned', label: 'Unassigned' }, ...team.map((u) => ({ value: u.id, label: u.name }))]} />
            <MultiSelectFilter label="Priority" value={priorities} onChange={setPriorities} options={PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} />
          </FilterBar>
          {filtersActive && <Typography level="body-xs" sx={{ mb: 1 }}>Drag-and-drop is paused while filters are active.</Typography>}
          <KanbanBoard
            projectId={project.id}
            tasks={visible}
            userById={userById}
            dragDisabled={filtersActive}
            canDrag={canWorkOn}
            onOpenTask={(t) => setSelectedId(t.id)}
            onAddTask={can('task:create') ? setAdding : undefined}
          />
        </TabPanel>

        <TabPanel value="overview" sx={{ p: 0 }}>
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <Typography level="title-md" component="h2">About</Typography>
                <Typography level="body-sm">{project.description || 'No description.'}</Typography>
                <Typography level="title-sm" sx={{ mt: 1 }}>Team</Typography>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {team.map((u) => (
                    <Box key={u.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <UserAvatar user={u} showName />
                      <Typography level="body-xs">{u.id === project.ownerId ? 'Owner' : 'Member'}</Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
            <Grid xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <Typography level="title-md" component="h2">Health score {health?.score}/100</Typography>
                <Typography level="body-xs">Starts at 100 and loses points for the factors below.</Typography>
                {health?.factors.map((f) => (
                  <Box key={f.label}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography level="body-sm">{f.label}</Typography>
                      <Typography level="body-xs">−{f.penalty} / {f.max}</Typography>
                    </Box>
                    <LinearProgress determinate value={(f.penalty / f.max) * 100} color={f.penalty / f.max > 0.5 ? 'danger' : 'warning'} />
                    <Typography level="body-xs">{f.detail}</Typography>
                  </Box>
                ))}
              </Card>
            </Grid>
            <Grid xs={12}><ActivityFeed projectId={project.id} limit={10} title="Project activity" /></Grid>
          </Grid>
        </TabPanel>
      </Tabs>

      <TaskDrawer open={!!selected} task={selected} onClose={() => setSelectedId(null)} />
      <TaskDrawer open={adding !== null} defaultProjectId={project.id} defaultStatus={adding ?? 'todo'} onClose={() => setAdding(null)} />
      <ProjectFormDialog open={editingProject} project={project} onClose={() => setEditingProject(false)} onDeleted={() => navigate('/projects')} />
    </>
  );
}

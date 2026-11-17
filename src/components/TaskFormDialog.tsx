import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/joy/Alert';
import Button from '@mui/joy/Button';
import Box from '@mui/joy/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { PRIORITIES, TASK_STATUSES } from '../constants';
import { useGetProjectsQuery, useGetUsersQuery, useCreateTaskMutation, useDeleteTaskMutation, useUpdateTaskMutation } from '../store/api';
import { useAppSelector } from '../store';
import type { Priority, Task, TaskInput, TaskStatus } from '../types';
import { fromDateInput, toDateInput } from '../utils/format';
import { can, canWorkOnTask } from '../utils/permissions';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Provide to edit; omit to create. */
  task?: Task;
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
}

interface FormState {
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string; // '' = unassigned
  dueDate: string; // yyyy-mm-dd
}

const inDays = (n: number) => toDateInput(new Date(Date.now() + n * 86_400_000).toISOString());

export function TaskFormDialog({ open, onClose, task, defaultProjectId, defaultStatus = 'todo' }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const { data: projects = [] } = useGetProjectsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [createTask, creating] = useCreateTaskMutation();
  const [updateTask, updating] = useUpdateTaskMutation();
  const [deleteTask, deleting] = useDeleteTaskMutation();

  const [form, setForm] = useState<FormState>({
    title: '', description: '', projectId: '', status: defaultStatus, priority: 'medium', assigneeId: '', dueDate: inDays(7),
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      task
        ? {
            title: task.title,
            description: task.description,
            projectId: task.projectId,
            status: task.status,
            priority: task.priority,
            assigneeId: task.assigneeId ?? '',
            dueDate: toDateInput(task.dueDate),
          }
        : {
            title: '',
            description: '',
            projectId: defaultProjectId ?? projects[0]?.id ?? '',
            status: defaultStatus,
            priority: 'medium',
            assigneeId: '',
            dueDate: inDays(7),
          },
    );
  }, [open, task, defaultProjectId, defaultStatus, projects]);

  const isEdit = !!task;
  // Members may only change the status of tasks assigned to them.
  const fullEdit = can(user.role, 'task:create');
  const statusOnly = isEdit && !fullEdit && !!task && canWorkOnTask(user, task);
  const disabledFields = isEdit && !fullEdit;

  const assignable = useMemo(() => {
    const project = projects.find((p) => p.id === form.projectId);
    if (!project) return [];
    const ids = new Set([project.ownerId, ...project.memberIds]);
    return users.filter((u) => ids.has(u.id));
  }, [projects, users, form.projectId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const busy = creating.isLoading || updating.isLoading || deleting.isLoading;

  const submit = async () => {
    if (!form.title.trim()) return setError('Title is required.');
    if (!form.projectId) return setError('Select a project.');
    const payload: TaskInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      projectId: form.projectId,
      status: form.status,
      priority: form.priority,
      assigneeId: form.assigneeId || null,
      dueDate: fromDateInput(form.dueDate),
    };
    try {
      if (task) {
        await updateTask({ id: task.id, patch: statusOnly ? { status: form.status } : payload }).unwrap();
      } else {
        await createTask(payload).unwrap();
      }
      onClose();
    } catch (e) {
      setError((e as { message?: string }).message ?? 'Something went wrong.');
    }
  };

  const remove = async () => {
    if (!task) return;
    try {
      await deleteTask(task.id).unwrap();
      onClose();
    } catch (e) {
      setError((e as { message?: string }).message ?? 'Something went wrong.');
    }
  };

  const readOnly = isEdit && !fullEdit && !statusOnly;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit task' : 'New task'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {error && <Alert color="danger">{error}</Alert>}
          <TextField label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} disabled={disabledFields} required />
          <TextField label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} multiline minRows={3} disabled={disabledFields} />
          <TextField select label="Project" value={form.projectId} onChange={(e) => set('projectId', e.target.value)} disabled={isEdit}>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField select label="Status" value={form.status} onChange={(e) => set('status', e.target.value as TaskStatus)} disabled={readOnly}>
              {TASK_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Priority" value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)} disabled={disabledFields}>
              {PRIORITIES.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Assignee" value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)} disabled={disabledFields || !can(user.role, 'task:assign')}>
              <MenuItem value="">Unassigned</MenuItem>
              {assignable.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
              ))}
            </TextField>
            <TextField type="date" label="Due date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} disabled={disabledFields} slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        {isEdit && can(user.role, 'task:delete') && (
          <Button color="danger" variant="plain" onClick={remove} disabled={busy} sx={{ mr: 'auto' }}>
            Delete
          </Button>
        )}
        <Button variant="plain" color="neutral" onClick={onClose}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && (
          <Button onClick={submit} loading={creating.isLoading || updating.isLoading}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

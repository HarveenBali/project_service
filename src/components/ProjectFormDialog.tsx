import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { PROJECT_STATUSES } from '../constants';
import { useCreateProjectMutation, useDeleteProjectMutation, useGetUsersQuery, useUpdateProjectMutation } from '../store/api';
import { useAppSelector } from '../store';
import type { Project, ProjectStatus } from '../types';
import { fromDateInput, toDateInput } from '../utils/format';
import { can } from '../utils/permissions';

interface Props {
  open: boolean;
  onClose: () => void;
  project?: Project;
  onDeleted?: () => void;
}

interface FormState {
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  memberIds: string[];
  startDate: string;
  endDate: string;
}

const inDays = (n: number) => toDateInput(new Date(Date.now() + n * 86_400_000).toISOString());

export function ProjectFormDialog({ open, onClose, project, onDeleted }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const { data: users = [] } = useGetUsersQuery();
  const [createProject, creating] = useCreateProjectMutation();
  const [updateProject, updating] = useUpdateProjectMutation();
  const [deleteProject, deleting] = useDeleteProjectMutation();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: '', description: '', status: 'planning', ownerId: user.id, memberIds: [], startDate: inDays(0), endDate: inDays(60),
  });

  const owners = useMemo(() => users.filter((u) => u.role !== 'member'), [users]);
  const members = useMemo(() => users.filter((u) => u.role === 'member'), [users]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      project
        ? {
            name: project.name,
            description: project.description,
            status: project.status,
            ownerId: project.ownerId,
            memberIds: project.memberIds,
            startDate: toDateInput(project.startDate),
            endDate: toDateInput(project.endDate),
          }
        : { name: '', description: '', status: 'planning', ownerId: user.role === 'manager' ? user.id : '', memberIds: [], startDate: inDays(0), endDate: inDays(60) },
    );
  }, [open, project, user]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.ownerId) return setError('Select an owner.');
    if (form.endDate < form.startDate) return setError('End date must be after the start date.');
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      ownerId: form.ownerId,
      memberIds: form.memberIds,
      startDate: fromDateInput(form.startDate),
      endDate: fromDateInput(form.endDate),
    };
    try {
      if (project) await updateProject({ id: project.id, patch: payload }).unwrap();
      else await createProject(payload).unwrap();
      onClose();
    } catch (e) {
      setError((e as { message?: string }).message ?? 'Something went wrong.');
    }
  };

  const remove = async () => {
    if (!project || !window.confirm(`Delete "${project.name}" and all of its tasks?`)) return;
    try {
      await deleteProject(project.id).unwrap();
      onClose();
      onDeleted?.();
    } catch (e) {
      setError((e as { message?: string }).message ?? 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{project ? 'Edit project' : 'New project'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {error && <Alert color="danger">{error}</Alert>}
          <TextField label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          <TextField label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} multiline minRows={2} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField select label="Status" value={form.status} onChange={(e) => set('status', e.target.value as ProjectStatus)}>
              {PROJECT_STATUSES.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Owner" value={form.ownerId} onChange={(e) => set('ownerId', e.target.value)} disabled={user.role === 'manager'}>
              {owners.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
              ))}
            </TextField>
            <TextField type="date" label="Start" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField type="date" label="End" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
          <TextField
            select
            label="Team members"
            value={form.memberIds}
            onChange={(e) => set('memberIds', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            slotProps={{
              select: {
                multiple: true,
                renderValue: (v) => (v as string[]).map((id) => users.find((u) => u.id === id)?.name ?? id).join(', '),
              },
            }}
          >
            {members.map((u) => (
              <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        {project && can(user.role, 'project:delete') && (
          <Button color="danger" variant="plain" onClick={remove} disabled={deleting.isLoading} sx={{ mr: 'auto' }}>
            Delete
          </Button>
        )}
        <Button variant="plain" color="neutral" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} loading={creating.isLoading || updating.isLoading}>
          {project ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

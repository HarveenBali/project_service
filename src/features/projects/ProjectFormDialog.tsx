import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import DialogActions from '@mui/joy/DialogActions';
import DialogContent from '@mui/joy/DialogContent';
import DialogTitle from '@mui/joy/DialogTitle';
import FormControl from '@mui/joy/FormControl';
import FormHelperText from '@mui/joy/FormHelperText';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Option from '@mui/joy/Option';
import Select from '@mui/joy/Select';
import Textarea from '@mui/joy/Textarea';
import { FormField } from '../../components/common/FormField';
import { PROJECT_STATUSES } from '../../constants';
import { useCurrentUser } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../hooks/useToast';
import { errorMessage } from '../../services/api';
import type { Project } from '../../types';
import { fromDateInput, toDateInput } from '../../utils/format';
import { useGetUsersQuery } from '../team/usersApi';
import { useCreateProjectMutation, useDeleteProjectMutation, useUpdateProjectMutation } from './projectsApi';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.').max(80, 'Keep the name under 80 characters.'),
    description: z.string().max(500, 'Description is too long.'),
    status: z.enum(['planning', 'active', 'on_hold', 'completed']),
    ownerId: z.string().min(1, 'Select an owner.'),
    memberIds: z.array(z.string()),
    startDate: z.string().min(1, 'Choose a start date.'),
    endDate: z.string().min(1, 'Choose an end date.'),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { path: ['endDate'], message: 'End date must be on or after the start date.' });

type Values = z.infer<typeof schema>;
const LISTBOX_ABOVE_MODAL = { listbox: { sx: { zIndex: 1400 } } };
const inDays = (n: number) => toDateInput(new Date(Date.now() + n * 86_400_000).toISOString());

interface Props {
  open: boolean;
  onClose: () => void;
  project?: Project;
  onDeleted?: () => void;
}

export function ProjectFormDialog({ open, onClose, project, onDeleted }: Props) {
  const user = useCurrentUser();
  const { can } = usePermissions();
  const toast = useToast();
  const { data: users = [] } = useGetUsersQuery();
  const [createProject, creating] = useCreateProjectMutation();
  const [updateProject, updating] = useUpdateProjectMutation();
  const [deleteProject, deleting] = useDeleteProjectMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const owners = useMemo(() => users.filter((u) => u.role !== 'member'), [users]);
  const members = useMemo(() => users.filter((u) => u.role === 'member'), [users]);

  const defaults = useMemo<Values>(
    () =>
      project
        ? { name: project.name, description: project.description, status: project.status, ownerId: project.ownerId, memberIds: project.memberIds, startDate: toDateInput(project.startDate), endDate: toDateInput(project.endDate) }
        : { name: '', description: '', status: 'planning', ownerId: user.role === 'manager' ? user.id : '', memberIds: [], startDate: inDays(0), endDate: inDays(60) },
    [project, user],
  );
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });

  useEffect(() => {
    if (open) {
      reset(defaults);
      setFormError(null);
    }
  }, [open, defaults, reset]);

  const onSubmit = async (v: Values) => {
    setFormError(null);
    const payload = { ...v, name: v.name.trim(), description: v.description.trim(), startDate: fromDateInput(v.startDate), endDate: fromDateInput(v.endDate) };
    try {
      if (project) await updateProject({ id: project.id, patch: payload }).unwrap();
      else await createProject(payload).unwrap();
      toast.show(project ? 'Project updated' : 'Project created');
      onClose();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  };

  const remove = async () => {
    if (!project || !window.confirm(`Delete "${project.name}" and all of its tasks?`)) return;
    try {
      await deleteProject(project.id).unwrap();
      toast.show('Project deleted');
      onClose();
      onDeleted?.();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ width: 'min(560px, 94vw)', maxHeight: '92vh', overflow: 'auto' }}>
        <DialogTitle>{project ? 'Edit project' : 'New project'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="project-form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ display: 'grid', gap: 2, pt: 1 }}>
            {formError && <Alert color="danger" role="alert">{formError}</Alert>}
            <FormField label="Name" error={errors.name?.message} {...register('name')} />
            <FormControl error={!!errors.description}>
              <FormLabel>Description</FormLabel>
              <Textarea minRows={2} {...register('description')} />
              {errors.description && <FormHelperText>{errors.description.message}</FormHelperText>}
            </FormControl>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Controller name="status" control={control} render={({ field }) => (
                <FormControl><FormLabel>Status</FormLabel>
                  <Select value={field.value} onChange={(_e, v) => v && field.onChange(v)} slotProps={LISTBOX_ABOVE_MODAL}>
                    {PROJECT_STATUSES.map((s) => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                  </Select>
                </FormControl>
              )} />
              <Controller name="ownerId" control={control} render={({ field }) => (
                <FormControl error={!!errors.ownerId}><FormLabel>Owner</FormLabel>
                  <Select value={field.value || null} placeholder="Select owner" onChange={(_e, v) => field.onChange(v ?? '')} disabled={user.role === 'manager'} slotProps={LISTBOX_ABOVE_MODAL}>
                    {owners.map((u) => <Option key={u.id} value={u.id}>{u.name}</Option>)}
                  </Select>
                  {errors.ownerId && <FormHelperText>{errors.ownerId.message}</FormHelperText>}
                </FormControl>
              )} />
              <FormControl error={!!errors.startDate}><FormLabel>Start</FormLabel><Input type="date" {...register('startDate')} /></FormControl>
              <FormControl error={!!errors.endDate}>
                <FormLabel>End</FormLabel><Input type="date" {...register('endDate')} />
                {errors.endDate && <FormHelperText>{errors.endDate.message}</FormHelperText>}
              </FormControl>
            </Box>
            <Controller name="memberIds" control={control} render={({ field }) => (
              <FormControl><FormLabel>Team members</FormLabel>
                <Select
                  multiple
                  value={field.value}
                  placeholder="Select members"
                  onChange={(_e, v) => field.onChange(v)}
                  slotProps={LISTBOX_ABOVE_MODAL}
                  renderValue={(sel) => <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{sel.map((o) => <Chip key={o.value} size="sm" variant="soft">{o.label}</Chip>)}</Box>}
                >
                  {members.map((u) => <Option key={u.id} value={u.id}>{u.name}</Option>)}
                </Select>
              </FormControl>
            )} />
          </Box>
        </DialogContent>
        <DialogActions>
          {project && can('project:delete') && (
            <Button color="danger" variant="plain" onClick={remove} loading={deleting.isLoading} sx={{ mr: 'auto' }}>Delete</Button>
          )}
          <Button variant="plain" color="neutral" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="project-form" loading={creating.isLoading || updating.isLoading}>{project ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  );
}

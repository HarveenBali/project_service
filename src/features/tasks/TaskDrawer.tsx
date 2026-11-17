import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import CloseRounded from '@mui/icons-material/CloseRounded';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import Drawer from '@mui/joy/Drawer';
import FormControl from '@mui/joy/FormControl';
import FormHelperText from '@mui/joy/FormHelperText';
import FormLabel from '@mui/joy/FormLabel';
import IconButton from '@mui/joy/IconButton';
import Input from '@mui/joy/Input';
import Option from '@mui/joy/Option';
import Select from '@mui/joy/Select';
import Textarea from '@mui/joy/Textarea';
import Typography from '@mui/joy/Typography';
import { FormField } from '../../components/common/FormField';
import { PRIORITIES, TASK_STATUSES } from '../../constants';
import { usePermissions } from '../../hooks/usePermissions';
import { useScopedData } from '../../hooks/useScopedData';
import { useToast } from '../../hooks/useToast';
import { errorMessage } from '../../services/api';
import type { Subtask, Task, TaskInput, TaskStatus } from '../../types';
import { fromDateInput, toDateInput } from '../../utils/format';
import { taskSchema } from './schemas';
import type { TaskFormValues } from './schemas';
import { SubtaskList } from './SubtaskList';
import { TaskComments } from './TaskComments';
import { useCreateTaskMutation, useDeleteTaskMutation, useUpdateTaskMutation } from './tasksApi';

// Joy's select popup must sit above the drawer's modal layer.
const LISTBOX_ABOVE_MODAL = { listbox: { sx: { zIndex: 1400 } } };
const inDays = (n: number) => toDateInput(new Date(Date.now() + n * 86_400_000).toISOString());

interface Props {
  open: boolean;
  onClose: () => void;
  /** Provide to edit; omit to create. */
  task?: Task;
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
}

export function TaskDrawer({ open, onClose, task, defaultProjectId, defaultStatus = 'todo' }: Props) {
  const { user, users, projects, userById } = useScopedData();
  const { can, canWorkOn } = usePermissions();
  const toast = useToast();
  const [createTask, creating] = useCreateTaskMutation();
  const [updateTask, updating] = useUpdateTaskMutation();
  const [deleteTask, deleting] = useDeleteTaskMutation();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const isEdit = !!task;
  const fullEdit = can('task:create');
  // Members may only change the status of tasks assigned to them.
  const statusOnly = isEdit && !fullEdit && !!task && canWorkOn(task);
  const readOnly = isEdit && !fullEdit && !statusOnly;
  const lockFields = isEdit && !fullEdit;

  const defaults = useMemo<TaskFormValues>(
    () =>
      task
        ? { title: task.title, description: task.description, projectId: task.projectId, status: task.status, priority: task.priority, assigneeId: task.assigneeId ?? '', dueDate: toDateInput(task.dueDate) }
        : { title: '', description: '', projectId: defaultProjectId ?? projects[0]?.id ?? '', status: defaultStatus, priority: 'medium', assigneeId: '', dueDate: inDays(7) },
    [task, defaultProjectId, defaultStatus, projects],
  );

  const { register, control, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;
    reset(defaults);
    setSubtasks(task?.subtasks ?? []);
    setFormError(null);
  }, [open, task, defaults, reset]);

  const projectId = watch('projectId');
  const assignable = useMemo(() => {
    const p = projects.find((x) => x.id === projectId);
    if (!p) return [];
    const ids = new Set([p.ownerId, ...p.memberIds]);
    return users.filter((u) => ids.has(u.id));
  }, [projects, users, projectId]);

  const onSubmit = async (v: TaskFormValues) => {
    setFormError(null);
    const payload: TaskInput = {
      title: v.title.trim(), description: v.description.trim(), projectId: v.projectId, status: v.status,
      priority: v.priority, assigneeId: v.assigneeId || null, dueDate: fromDateInput(v.dueDate), subtasks,
    };
    try {
      if (task) {
        await updateTask({ id: task.id, projectId: task.projectId, patch: statusOnly ? { status: v.status } : payload }).unwrap();
        toast.show('Task updated');
      } else {
        await createTask(payload).unwrap();
        toast.show('Task created');
      }
      onClose();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  };

  const changeSubtasks = (next: Subtask[]) => {
    setSubtasks(next);
    if (task) {
      updateTask({ id: task.id, projectId: task.projectId, patch: { subtasks: next } })
        .unwrap()
        .catch((e) => { setSubtasks(task.subtasks); toast.error(errorMessage(e, 'Could not update subtasks.')); });
    }
  };

  const remove = async () => {
    if (!task || !window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await deleteTask(task.id).unwrap();
      toast.show('Task deleted');
      onClose();
    } catch (e) {
      setFormError(errorMessage(e));
    }
  };

  return (
    <Drawer open={open} onClose={onClose} anchor="right" size="md" slotProps={{ content: { sx: { width: { xs: '100%', sm: 520 }, p: 0 }, 'aria-label': isEdit ? 'Task details' : 'New task' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography level="title-lg" component="h2">{isEdit ? 'Task details' : 'New task'}</Typography>
          <IconButton variant="plain" size="sm" aria-label="Close" onClick={onClose}><CloseRounded /></IconButton>
        </Box>
        <Divider />
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'grid', gap: 3, alignContent: 'start' }}>
          <Box component="form" id="task-form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ display: 'grid', gap: 2 }}>
            {formError && <Alert color="danger" role="alert">{formError}</Alert>}
            <FormField label="Title" disabled={lockFields} error={errors.title?.message} {...register('title')} />
            <FormControl error={!!errors.description}>
              <FormLabel>Description</FormLabel>
              <Textarea minRows={3} disabled={lockFields} {...register('description')} />
              {errors.description && <FormHelperText>{errors.description.message}</FormHelperText>}
            </FormControl>
            <Controller name="projectId" control={control} render={({ field }) => (
              <FormControl error={!!errors.projectId}>
                <FormLabel>Project</FormLabel>
                <Select value={field.value} onChange={(_e, v) => field.onChange(v ?? '')} disabled={isEdit} slotProps={LISTBOX_ABOVE_MODAL}>
                  {projects.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                </Select>
                {errors.projectId && <FormHelperText>{errors.projectId.message}</FormHelperText>}
              </FormControl>
            )} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Controller name="status" control={control} render={({ field }) => (
                <FormControl><FormLabel>Status</FormLabel>
                  <Select value={field.value} onChange={(_e, v) => v && field.onChange(v)} disabled={readOnly} slotProps={LISTBOX_ABOVE_MODAL}>
                    {TASK_STATUSES.map((s) => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                  </Select>
                </FormControl>
              )} />
              <Controller name="priority" control={control} render={({ field }) => (
                <FormControl><FormLabel>Priority</FormLabel>
                  <Select value={field.value} onChange={(_e, v) => v && field.onChange(v)} disabled={lockFields} slotProps={LISTBOX_ABOVE_MODAL}>
                    {PRIORITIES.map((p) => <Option key={p.value} value={p.value}>{p.label}</Option>)}
                  </Select>
                </FormControl>
              )} />
              <Controller name="assigneeId" control={control} render={({ field }) => (
                <FormControl><FormLabel>Assignee</FormLabel>
                  <Select value={field.value} onChange={(_e, v) => field.onChange(v ?? '')} disabled={lockFields || !can('task:assign')} slotProps={LISTBOX_ABOVE_MODAL}>
                    <Option value="">Unassigned</Option>
                    {assignable.map((u) => <Option key={u.id} value={u.id}>{u.name}</Option>)}
                  </Select>
                </FormControl>
              )} />
              <FormControl error={!!errors.dueDate}>
                <FormLabel>Due date</FormLabel>
                <Input type="date" disabled={lockFields} {...register('dueDate')} />
                {errors.dueDate && <FormHelperText>{errors.dueDate.message}</FormHelperText>}
              </FormControl>
            </Box>
          </Box>

          <SubtaskList subtasks={subtasks} disabled={lockFields} onChange={changeSubtasks} />
          {task && (
            <>
              <Divider />
              <TaskComments taskId={task.id} userById={userById} />
            </>
          )}
        </Box>
        <Divider />
        <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
          {isEdit && can('task:delete') && (
            <Button color="danger" variant="plain" onClick={remove} loading={deleting.isLoading} sx={{ mr: 'auto' }}>Delete</Button>
          )}
          <Button variant="plain" color="neutral" onClick={onClose} sx={{ ml: 'auto' }}>{readOnly ? 'Close' : 'Cancel'}</Button>
          {!readOnly && (
            <Button type="submit" form="task-form" loading={creating.isLoading || updating.isLoading} disabled={isEdit && !isDirty}>
              {isEdit ? 'Save changes' : 'Create task'}
            </Button>
          )}
        </Box>
        {user.role === 'member' && isEdit && <Typography level="body-xs" sx={{ px: 2, pb: 1 }}>Members can update the status of tasks assigned to them.</Typography>}
      </Box>
    </Drawer>
  );
}

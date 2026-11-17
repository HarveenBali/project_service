import { memo } from 'react';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import LinearProgress from '@mui/joy/LinearProgress';
import Typography from '@mui/joy/Typography';
import { PriorityChip } from '../../components/common/Chips';
import { UserAvatar } from '../../components/common/UserAvatar';
import type { Task, User } from '../../types';
import { formatDate, isOverdue } from '../../utils/format';

interface Props {
  task: Task;
  assignee?: User;
  dragging?: boolean;
}

/** Presentational card, memoised so unrelated board updates do not re-render every card. */
export const TaskCard = memo(function TaskCard({ task, assignee, dragging }: Props) {
  const overdue = isOverdue(task);
  const done = task.subtasks.filter((s) => s.done).length;
  return (
    <Card variant="outlined" size="sm" sx={{ gap: 1, boxShadow: dragging ? 'lg' : undefined, '&:hover': { boxShadow: 'sm' } }}>
      <Typography level="title-sm">{task.title}</Typography>
      {task.subtasks.length > 0 && (
        <Box>
          <Typography level="body-xs">Subtasks {done}/{task.subtasks.length}</Typography>
          <LinearProgress determinate value={(done / task.subtasks.length) * 100} size="sm" color="success" />
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PriorityChip priority={task.priority} />
        <UserAvatar user={assignee} />
      </Box>
      <Typography level="body-xs" color={overdue ? 'danger' : 'neutral'}>
        {overdue ? 'Overdue · ' : 'Due '}
        {formatDate(task.dueDate)}
      </Typography>
    </Card>
  );
});

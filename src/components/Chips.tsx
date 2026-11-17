import Chip from '@mui/joy/Chip';
import { PRIORITIES, PROJECT_STATUSES, TASK_STATUSES, findOption } from '../constants';
import type { Priority, ProjectStatus, TaskStatus } from '../types';

export function StatusChip({ status }: { status: TaskStatus }) {
  const o = findOption(TASK_STATUSES, status);
  return (
    <Chip size="sm" variant="soft" color={o.color}>
      {o.label}
    </Chip>
  );
}

export function PriorityChip({ priority }: { priority: Priority }) {
  const o = findOption(PRIORITIES, priority);
  return (
    <Chip size="sm" variant="outlined" color={o.color}>
      {o.label}
    </Chip>
  );
}

export function ProjectStatusChip({ status }: { status: ProjectStatus }) {
  const o = findOption(PROJECT_STATUSES, status);
  return (
    <Chip size="sm" variant="soft" color={o.color}>
      {o.label}
    </Chip>
  );
}

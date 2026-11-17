import type { Priority, ProjectStatus, Role, TaskStatus } from './types';

export type ChipColor = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

interface Option<T extends string> {
  value: T;
  label: string;
  color: ChipColor;
  /** Hex colour used by charts. */
  hex: string;
}

export const TASK_STATUSES: Option<TaskStatus>[] = [
  { value: 'todo', label: 'To do', color: 'neutral', hex: '#94a3b8' },
  { value: 'in_progress', label: 'In progress', color: 'primary', hex: '#3b82f6' },
  { value: 'review', label: 'In review', color: 'warning', hex: '#f59e0b' },
  { value: 'done', label: 'Done', color: 'success', hex: '#22c55e' },
];

export const PRIORITIES: Option<Priority>[] = [
  { value: 'low', label: 'Low', color: 'neutral', hex: '#94a3b8' },
  { value: 'medium', label: 'Medium', color: 'primary', hex: '#3b82f6' },
  { value: 'high', label: 'High', color: 'warning', hex: '#f59e0b' },
  { value: 'critical', label: 'Critical', color: 'danger', hex: '#ef4444' },
];

export const PROJECT_STATUSES: Option<ProjectStatus>[] = [
  { value: 'planning', label: 'Planning', color: 'neutral', hex: '#94a3b8' },
  { value: 'active', label: 'Active', color: 'success', hex: '#22c55e' },
  { value: 'on_hold', label: 'On hold', color: 'warning', hex: '#f59e0b' },
  { value: 'completed', label: 'Completed', color: 'primary', hex: '#3b82f6' },
];

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
};

export const STATUS_RANK = Object.fromEntries(TASK_STATUSES.map((s, i) => [s.value, i])) as Record<TaskStatus, number>;
export const PRIORITY_RANK = Object.fromEntries(PRIORITIES.map((p, i) => [p.value, i])) as Record<Priority, number>;

export const findOption = <T extends string>(list: Option<T>[], value: T) =>
  list.find((o) => o.value === value) ?? list[0];

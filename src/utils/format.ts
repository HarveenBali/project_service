import type { Task } from '../types';

const dateFmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const toDateInput = (iso: string) => iso.slice(0, 10);
export const fromDateInput = (value: string) => new Date(`${value}T12:00:00`).toISOString();
export const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const isOverdue = (task: Pick<Task, 'status' | 'dueDate'>, now = Date.now()) =>
  task.status !== 'done' && new Date(task.dueDate).getTime() < now;

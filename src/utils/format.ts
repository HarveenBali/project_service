import type { Task } from '../types';

const dateFmt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const relFmt = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

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

export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relFmt.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

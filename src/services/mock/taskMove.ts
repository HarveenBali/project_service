import type { Task, TaskStatus } from '../../types';

/**
 * Pure helper shared by the mock server and the optimistic cache update, so both
 * produce the same result. Moves a task to `status` at `index` within that column
 * and renumbers the target column. Returns new objects only for changed tasks.
 */
export function applyMove(tasks: Task[], id: string, status: TaskStatus, index: number): Task[] {
  const moving = tasks.find((t) => t.id === id);
  if (!moving) return tasks;

  const column = tasks
    .filter((t) => t.projectId === moving.projectId && t.status === status && t.id !== id)
    .sort((a, b) => a.order - b.order);

  const updated: Task = {
    ...moving,
    status,
    completedAt: status === 'done' ? (moving.completedAt ?? new Date().toISOString()) : undefined,
  };
  column.splice(Math.max(0, Math.min(index, column.length)), 0, updated);
  const orderById = new Map(column.map((t, i) => [t.id, i]));

  return tasks.map((t) => {
    const order = orderById.get(t.id);
    if (order === undefined) return t;
    const base = t.id === id ? updated : t;
    return base === t && t.order === order ? t : { ...base, order };
  });
}

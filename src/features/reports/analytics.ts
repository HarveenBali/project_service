import { PRIORITIES, TASK_STATUSES } from '../../constants';
import type { Project, Task, TaskStatus, User } from '../../types';
import { isOverdue } from '../../utils/format';

const DAY = 86_400_000;

export const statusCounts = (tasks: Task[]) =>
  TASK_STATUSES.map((s) => ({ key: s.value, name: s.label, value: tasks.filter((t) => t.status === s.value).length, fill: s.hex }));

export const priorityCounts = (tasks: Task[]) =>
  PRIORITIES.map((p) => ({ key: p.value, name: p.label, value: tasks.filter((t) => t.priority === p.value).length, fill: p.hex }));

export type WorkloadRow = { name: string } & Record<TaskStatus, number>;

export function workloadByUser(tasks: Task[], users: User[]): WorkloadRow[] {
  const rows = new Map<string, WorkloadRow>(
    users.map((u) => [u.id, { name: u.name.split(' ')[0], todo: 0, in_progress: 0, review: 0, done: 0 }]),
  );
  for (const t of tasks) {
    const row = t.assigneeId ? rows.get(t.assigneeId) : undefined;
    if (row) row[t.status]++;
  }
  return [...rows.values()].filter((r) => r.todo + r.in_progress + r.review + r.done > 0);
}

/** Created vs completed tasks for each of the last `weeks` calendar weeks (Monday start). */
export function weeklyTrend(tasks: Task[], weeks: number, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const label = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  return Array.from({ length: weeks }, (_, i) => {
    const from = start.getTime() - (weeks - 1 - i) * 7 * DAY;
    const to = from + 7 * DAY;
    const within = (iso?: string) => {
      if (!iso) return false;
      const ts = new Date(iso).getTime();
      return ts >= from && ts < to;
    };
    return {
      week: label.format(new Date(from)),
      created: tasks.filter((t) => within(t.createdAt)).length,
      completed: tasks.filter((t) => within(t.completedAt)).length,
    };
  });
}

export function projectProgress(projects: Project[], tasks: Task[]) {
  const byProject = new Map<string, Task[]>();
  for (const t of tasks) byProject.set(t.projectId, [...(byProject.get(t.projectId) ?? []), t]);
  return projects.map((project) => {
    const own = byProject.get(project.id) ?? [];
    const done = own.filter((t) => t.status === 'done').length;
    return {
      id: project.id,
      name: project.name,
      total: own.length,
      done,
      overdue: own.filter((t) => isOverdue(t)).length,
      percent: own.length ? Math.round((done / own.length) * 100) : 0,
    };
  });
}

export function summary(tasks: Task[]) {
  const done = tasks.filter((t) => t.status === 'done');
  const cycleDays = done
    .filter((t) => t.completedAt)
    .map((t) => (new Date(t.completedAt as string).getTime() - new Date(t.createdAt).getTime()) / DAY);
  return {
    total: tasks.length,
    open: tasks.length - done.length,
    done: done.length,
    overdue: tasks.filter((t) => isOverdue(t)).length,
    completionRate: tasks.length ? Math.round((done.length / tasks.length) * 100) : 0,
    avgCycleDays: cycleDays.length ? Math.round((cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) * 10) / 10 : 0,
  };
}

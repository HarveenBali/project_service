import type { Project, Task } from '../../types';
import { isOverdue } from '../../utils/format';

const DAY = 86_400_000;

export interface HealthFactor {
  label: string;
  /** Points lost, 0 to `max`. */
  penalty: number;
  max: number;
  detail: string;
}

export interface Health {
  score: number;
  level: 'healthy' | 'at_risk' | 'critical';
  factors: HealthFactor[];
}

/**
 * Transparent project health score, starting at 100 and losing points for:
 *  - overdue work        (up to 40): share of open tasks that are past due
 *  - schedule slippage   (up to 30): completed share lagging behind elapsed time
 *  - deadline risk       (up to 20): open tasks due within 7 days relative to the open total
 *  - unassigned work     (up to 10): share of open tasks without an assignee
 */
export function projectHealth(project: Project, tasks: Task[], now = Date.now()): Health {
  const own = tasks.filter((t) => t.projectId === project.id);
  const open = own.filter((t) => t.status !== 'done');
  const share = (n: number, d: number) => (d === 0 ? 0 : n / d);

  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  const elapsed = end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : 1;
  const completed = share(own.length - open.length, own.length);
  const slip = own.length === 0 ? 0 : Math.max(0, elapsed - completed);

  const soon = open.filter((t) => {
    const due = new Date(t.dueDate).getTime();
    return due >= now && due - now <= 7 * DAY;
  }).length;
  const overdue = open.filter((t) => isOverdue(t, now)).length;
  const unassigned = open.filter((t) => !t.assigneeId).length;

  const factors: HealthFactor[] = [
    { label: 'Overdue work', max: 40, penalty: Math.round(share(overdue, open.length) * 40), detail: `${overdue} of ${open.length} open tasks overdue` },
    { label: 'Schedule', max: 30, penalty: Math.round(slip * 30), detail: `${Math.round(completed * 100)}% done, ${Math.round(elapsed * 100)}% of time elapsed` },
    { label: 'Deadline risk', max: 20, penalty: Math.round(Math.min(1, share(soon, open.length) * 2) * 20), detail: `${soon} tasks due within 7 days` },
    { label: 'Unassigned', max: 10, penalty: Math.round(share(unassigned, open.length) * 10), detail: `${unassigned} open tasks without an owner` },
  ];

  const score = Math.max(0, 100 - factors.reduce((sum, f) => sum + f.penalty, 0));
  return { score, level: score >= 75 ? 'healthy' : score >= 50 ? 'at_risk' : 'critical', factors };
}

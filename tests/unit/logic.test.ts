import { describe, expect, it } from 'vitest';
import { projectHealth } from '../../src/features/projects/health';
import { summary, weeklyTrend } from '../../src/features/reports/analytics';
import { applyPatch } from '../../src/features/tasks/tasksApi';
import { applyMove } from '../../src/services/mock/taskMove';
import type { Project, Task } from '../../src/types';
import { toCsv } from '../../src/utils/csv';
import { can, canWorkOnTask } from '../../src/utils/permissions';

const DAY = 86_400_000;
const NOW = Date.now();
const iso = (days: number) => new Date(NOW + days * DAY).toISOString();

const task = (over: Partial<Task>): Task => ({
  id: 't', projectId: 'p', title: 'T', description: '', status: 'todo', priority: 'medium',
  assigneeId: 'u1', dueDate: iso(5), createdAt: iso(-10), subtasks: [], order: 0, ...over,
});
const project: Project = {
  id: 'p', name: 'P', description: '', status: 'active', ownerId: 'm', memberIds: ['u1'], startDate: iso(-50), endDate: iso(50),
};

describe('applyMove', () => {
  const tasks = [task({ id: 'a', order: 0 }), task({ id: 'b', order: 1 }), task({ id: 'c', order: 2 }), task({ id: 'd', status: 'done', order: 0 })];

  it('reorders inside a column', () => {
    const next = applyMove(tasks, 'a', 'todo', 2);
    const order = next.filter((t) => t.status === 'todo').sort((x, y) => x.order - y.order).map((t) => t.id);
    expect(order).toEqual(['b', 'c', 'a']);
  });

  it('moves across columns and sets completedAt for done', () => {
    const next = applyMove(tasks, 'b', 'done', 0);
    const moved = next.find((t) => t.id === 'b');
    expect(moved?.status).toBe('done');
    expect(moved?.completedAt).toBeDefined();
    expect(next.find((t) => t.id === 'd')?.order).toBe(1);
  });

  it('clamps an out-of-range index and ignores unknown ids', () => {
    expect(applyMove(tasks, 'a', 'done', 99).find((t) => t.id === 'a')?.order).toBe(1);
    expect(applyMove(tasks, 'missing', 'done', 0)).toBe(tasks);
  });

  it('does not mutate its input', () => {
    const copy = JSON.stringify(tasks);
    applyMove(tasks, 'a', 'done', 0);
    expect(JSON.stringify(tasks)).toBe(copy);
  });
});

describe('applyPatch (optimistic update)', () => {
  it('applies fields and moves the task to the end of the new column', () => {
    const tasks = [task({ id: 'a' }), task({ id: 'b', status: 'done', order: 0 })];
    const next = applyPatch(tasks, 'a', { status: 'done', assigneeId: null });
    const a = next.find((t) => t.id === 'a');
    expect(a).toMatchObject({ status: 'done', assigneeId: null, order: 1 });
  });
});

describe('projectHealth', () => {
  it('is 100 for a project with no open work', () => {
    expect(projectHealth(project, [task({ status: 'done' })], NOW).score).toBeGreaterThan(40);
    expect(projectHealth(project, [], NOW).score).toBe(100);
  });

  it('penalises overdue and unassigned work, and explains each factor', () => {
    const tasks = [task({ id: '1', dueDate: iso(-3), assigneeId: null }), task({ id: '2', dueDate: iso(-1), assigneeId: null })];
    const h = projectHealth(project, tasks, NOW);
    expect(h.score).toBeLessThan(50);
    expect(h.level).toBe('critical');
    expect(h.factors.find((f) => f.label === 'Overdue work')?.penalty).toBe(40);
    expect(h.factors).toHaveLength(4);
  });
});

describe('analytics', () => {
  it('summarises completion and overdue counts', () => {
    const s = summary([task({ id: '1', status: 'done', completedAt: iso(-5) }), task({ id: '2', dueDate: iso(-2) }), task({ id: '3' })]);
    expect(s).toMatchObject({ total: 3, done: 1, open: 2, overdue: 1, completionRate: 33 });
  });

  it('buckets created and completed tasks by week', () => {
    const trend = weeklyTrend([task({ createdAt: iso(0), status: 'done', completedAt: iso(0) })], 4, new Date(NOW));
    expect(trend).toHaveLength(4);
    expect(trend[3]).toMatchObject({ created: 1, completed: 1 });
    expect(trend[0]).toMatchObject({ created: 0, completed: 0 });
  });
});

describe('csv export', () => {
  it('quotes values and neutralises spreadsheet formulas', () => {
    const csv = toCsv(['A', 'B'], [['=SUM(1,2)', 'say "hi"']]);
    expect(csv).toContain(`"'=SUM(1,2)"`);
    expect(csv).toContain('"say ""hi"""');
  });
});

describe('permissions', () => {
  it('limits members', () => {
    expect(can('member', 'task:create')).toBe(false);
    expect(can('manager', 'task:create')).toBe(true);
    expect(can('manager', 'team:manage')).toBe(false);
    expect(can('admin', 'team:manage')).toBe(true);
  });

  it('lets members work only on their own tasks', () => {
    const me = { id: 'u1', name: 'Me', email: 'm@x.dev', role: 'member' as const };
    expect(canWorkOnTask(me, task({ assigneeId: 'u1' }))).toBe(true);
    expect(canWorkOnTask(me, task({ assigneeId: 'u2' }))).toBe(false);
  });
});

import type { Project, Task } from '../../types';
import {
  DAY, PRIORITY_POOL, SEED_USERS, STATUS_POOL, SUBTASK_TITLES, TITLES, rng,
} from './seed';
import type { DbState } from './seed';

export function buildSeed(): DbState {
  const now = Date.now();
  const iso = (offsetDays: number) => new Date(now + offsetDays * DAY).toISOString();

  const mk = (id: string, name: string, description: string, status: Project['status'], ownerId: string, memberIds: string[], start: number, end: number): Project => ({
    id, name, description, status, ownerId, memberIds, startDate: iso(start), endDate: iso(end),
  });
  const projects: Project[] = [
    mk('p1', 'Customer Portal Revamp', 'Redesign the customer self-service portal.', 'active', 'u-m1', ['u-d1', 'u-d2', 'u-d3'], -60, 30),
    mk('p2', 'Mobile App v2', 'Second major release of the mobile app.', 'active', 'u-m1', ['u-d2', 'u-d4', 'u-d5'], -40, 55),
    mk('p3', 'Data Warehouse Migration', 'Move reporting data to the new warehouse.', 'on_hold', 'u-m2', ['u-d1', 'u-d3', 'u-d5'], -90, 15),
    mk('p4', 'Billing Automation', 'Automate invoicing and reconciliation.', 'active', 'u-m2', ['u-d3', 'u-d4', 'u-d5'], -25, 70),
    mk('p5', 'Security Compliance Audit', 'Prepare evidence for the annual audit.', 'planning', 'u-m2', ['u-d1', 'u-d2', 'u-d4'], 5, 90),
  ];

  const rand = rng(42);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const tasks: Task[] = [];
  const counters = new Map<string, number>();

  for (const project of projects) {
    for (let i = 0; i < 10; i++) {
      const status = pick(STATUS_POOL);
      const key = `${project.id}:${status}`;
      const order = counters.get(key) ?? 0;
      counters.set(key, order + 1);
      const createdOffset = -Math.floor(rand() * 60) - 1;
      const subtaskCount = Math.floor(rand() * 4);
      tasks.push({
        id: `t-${project.id}-${i + 1}`,
        projectId: project.id,
        title: pick(TITLES),
        description: 'Auto-generated sample task.',
        status,
        priority: pick(PRIORITY_POOL),
        assigneeId: rand() < 0.1 ? null : pick(project.memberIds),
        dueDate: iso(Math.floor(rand() * 40) - 12),
        createdAt: iso(createdOffset),
        completedAt: status === 'done' ? iso(Math.min(-1, createdOffset + Math.floor(rand() * 25) + 2)) : undefined,
        subtasks: Array.from({ length: subtaskCount }, (_, k) => ({
          id: `st-${project.id}-${i + 1}-${k}`,
          title: SUBTASK_TITLES[k % SUBTASK_TITLES.length],
          done: status === 'done' || rand() < 0.4,
        })),
        order,
      });
    }
  }

  const first = tasks[0];
  return {
    users: SEED_USERS,
    projects,
    tasks,
    comments: [
      { id: 'c1', taskId: first.id, authorId: 'u-m1', body: 'Please share a first draft by Friday. @Dev', createdAt: iso(-3) },
    ],
    activity: [
      { id: 'a1', actorId: 'u-m1', message: `created project "${projects[0].name}"`, createdAt: iso(-60), projectId: 'p1' },
      { id: 'a2', actorId: 'u-m2', message: `put "${projects[2].name}" on hold`, createdAt: iso(-5), projectId: 'p3' },
    ],
    notifications: [
      { id: 'n1', userId: 'u-d1', message: 'Brian Smith mentioned you in a comment', createdAt: iso(-3), read: false, link: `/tasks?open=${first.id}` },
    ],
  };
}

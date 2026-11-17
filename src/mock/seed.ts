import type { Priority, Project, Task, TaskStatus, User } from '../types';

const DAY = 86_400_000;

export const USERS: User[] = [
  { id: 'u-admin', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
  { id: 'u-m1', name: 'Brian Smith', email: 'brian@example.com', role: 'manager' },
  { id: 'u-m2', name: 'Carla Gomez', email: 'carla@example.com', role: 'manager' },
  { id: 'u-d1', name: 'Dev Patel', email: 'dev@example.com', role: 'member' },
  { id: 'u-d2', name: 'Emma Wilson', email: 'emma@example.com', role: 'member' },
  { id: 'u-d3', name: 'Farid Khan', email: 'farid@example.com', role: 'member' },
  { id: 'u-d4', name: 'Grace Lee', email: 'grace@example.com', role: 'member' },
  { id: 'u-d5', name: 'Hiro Tanaka', email: 'hiro@example.com', role: 'member' },
];

/** Small deterministic PRNG so the seed data is the same on every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const TITLES = [
  'Design data model',
  'Set up CI pipeline',
  'Write API contract',
  'Implement authentication',
  'Build reporting screen',
  'Review accessibility',
  'Performance profiling',
  'Fix pagination bug',
  'Add audit logging',
  'Prepare release notes',
  'Migrate legacy records',
  'Security hardening',
  'Write integration tests',
  'Refine onboarding flow',
  'Set up monitoring alerts',
  'Update documentation',
  'Optimise database queries',
  'Create email templates',
  'Stakeholder demo prep',
  'Cleanup feature flags',
];

const STATUS_POOL: TaskStatus[] = ['todo', 'todo', 'in_progress', 'in_progress', 'review', 'done', 'done', 'done'];
const PRIORITY_POOL: Priority[] = ['low', 'medium', 'medium', 'high', 'high', 'critical'];

export function buildSeed(): { projects: Project[]; tasks: Task[] } {
  const now = Date.now();
  const iso = (offsetDays: number) => new Date(now + offsetDays * DAY).toISOString();

  const projects: Project[] = [
    { id: 'p1', name: 'Customer Portal Revamp', description: 'Redesign the customer self-service portal.', status: 'active', ownerId: 'u-m1', memberIds: ['u-d1', 'u-d2', 'u-d3'], startDate: iso(-60), endDate: iso(30) },
    { id: 'p2', name: 'Mobile App v2', description: 'Second major release of the mobile app.', status: 'active', ownerId: 'u-m1', memberIds: ['u-d2', 'u-d4', 'u-d5'], startDate: iso(-40), endDate: iso(55) },
    { id: 'p3', name: 'Data Warehouse Migration', description: 'Move reporting data to the new warehouse.', status: 'on_hold', ownerId: 'u-m2', memberIds: ['u-d1', 'u-d3', 'u-d5'], startDate: iso(-90), endDate: iso(15) },
    { id: 'p4', name: 'Billing Automation', description: 'Automate invoicing and reconciliation.', status: 'active', ownerId: 'u-m2', memberIds: ['u-d3', 'u-d4', 'u-d5'], startDate: iso(-25), endDate: iso(70) },
    { id: 'p5', name: 'Security Compliance Audit', description: 'Prepare evidence for the annual audit.', status: 'planning', ownerId: 'u-m2', memberIds: ['u-d1', 'u-d2', 'u-d4'], startDate: iso(5), endDate: iso(90) },
  ];

  const rand = rng(42);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const tasks: Task[] = [];
  const counters = new Map<string, number>();

  projects.forEach((project) => {
    for (let i = 0; i < 10; i++) {
      const status = pick(STATUS_POOL);
      const key = `${project.id}:${status}`;
      const order = counters.get(key) ?? 0;
      counters.set(key, order + 1);

      const createdOffset = -Math.floor(rand() * 60) - 1;
      const createdAt = iso(createdOffset);
      const unassigned = rand() < 0.1;
      tasks.push({
        id: `t-${project.id}-${i + 1}`,
        projectId: project.id,
        title: `${pick(TITLES)}`,
        description: 'Auto-generated sample task.',
        status,
        priority: pick(PRIORITY_POOL),
        assigneeId: unassigned ? null : pick(project.memberIds),
        dueDate: iso(Math.floor(rand() * 40) - 12),
        createdAt,
        completedAt: status === 'done' ? iso(Math.min(-1, createdOffset + Math.floor(rand() * 25) + 2)) : undefined,
        order,
      });
    }
  });

  return { projects, tasks };
}

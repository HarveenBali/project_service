import type { Activity, AppNotification, Comment, Priority, Project, Role, Task, TaskStatus } from '../../types';

const DAY = 86_400_000;

/** Mock-only: a real backend stores salted password hashes, never plain text. */
export const DEMO_PASSWORD = 'Demo1234';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
}

export interface DbState {
  users: DbUser[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  activity: Activity[];
  notifications: AppNotification[];
}

const user = (id: string, name: string, email: string, role: Role): DbUser => ({ id, name, email, role, password: DEMO_PASSWORD });

export const SEED_USERS: DbUser[] = [
  user('u-admin', 'Alice Johnson', 'admin@flowsync.dev', 'admin'),
  user('u-m1', 'Brian Smith', 'manager@flowsync.dev', 'manager'),
  user('u-m2', 'Carla Gomez', 'carla@flowsync.dev', 'manager'),
  user('u-d1', 'Dev Patel', 'member@flowsync.dev', 'member'),
  user('u-d2', 'Emma Wilson', 'emma@flowsync.dev', 'member'),
  user('u-d3', 'Farid Khan', 'farid@flowsync.dev', 'member'),
  user('u-d4', 'Grace Lee', 'grace@flowsync.dev', 'member'),
  user('u-d5', 'Hiro Tanaka', 'hiro@flowsync.dev', 'member'),
];

/** Small deterministic PRNG so the seed data is the same on every fresh load. */
export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const TITLES = [
  'Design data model', 'Set up CI pipeline', 'Write API contract', 'Implement authentication',
  'Build reporting screen', 'Review accessibility', 'Performance profiling', 'Fix pagination bug',
  'Add audit logging', 'Prepare release notes', 'Migrate legacy records', 'Security hardening',
  'Write integration tests', 'Refine onboarding flow', 'Set up monitoring alerts', 'Update documentation',
  'Optimise database queries', 'Create email templates', 'Stakeholder demo prep', 'Cleanup feature flags',
];
export const SUBTASK_TITLES = ['Draft', 'Peer review', 'Implement', 'Test', 'Ship'];
export const STATUS_POOL: TaskStatus[] = ['todo', 'todo', 'in_progress', 'in_progress', 'review', 'done', 'done', 'done'];
export const PRIORITY_POOL: Priority[] = ['low', 'medium', 'medium', 'high', 'high', 'critical'];
export { DAY };

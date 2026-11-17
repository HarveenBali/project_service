import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_PASSWORD } from '../../src/services/mock/seed';
import * as authDb from '../../src/services/mock/authDb';
import { addComment, createTask, listComments, queryTasks, updateTask } from '../../src/services/mock/tasksDb';
import { listNotifications, updateUser } from '../../src/services/mock/miscDb';
import { resetDb } from '../../src/services/mock/state';
import { initialFilters } from '../../src/features/tasks/taskFiltersSlice';

beforeEach(() => resetDb());

describe('mock auth', () => {
  it('signs in with valid credentials and hides the password', () => {
    const session = authDb.login('admin@flowsync.dev', DEMO_PASSWORD);
    expect(session.user.role).toBe('admin');
    expect(session.user).not.toHaveProperty('password');
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });

  it('gives one generic error for bad email or password', () => {
    expect(() => authDb.login('nobody@x.dev', 'whatever')).toThrow('Invalid email or password.');
    expect(() => authDb.login('admin@flowsync.dev', 'wrong')).toThrow('Invalid email or password.');
  });

  it('creates members on signup and rejects duplicate emails', () => {
    const session = authDb.signup('New Person', 'new@x.dev', 'Passw0rdX');
    expect(session.user.role).toBe('member');
    expect(() => authDb.signup('Other', 'NEW@x.dev', 'Passw0rdX')).toThrow(/already exists/);
  });
});

describe('queryTasks', () => {
  it('paginates and reports the total', () => {
    const page = queryTasks({ ...initialFilters, pageSize: 7 });
    expect(page.items).toHaveLength(7);
    expect(page.total).toBe(50);
  });

  it('filters by status and sorts by due date', () => {
    const page = queryTasks({ ...initialFilters, statuses: ['done'], pageSize: 50, sortBy: 'dueDate', sortDir: 'desc' });
    expect(page.items.every((t) => t.status === 'done')).toBe(true);
    const dates = page.items.map((t) => t.dueDate);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('applies member and manager scopes', () => {
    const mine = queryTasks({ ...initialFilters, pageSize: 50, scopeUserId: 'u-d1' });
    expect(mine.items.every((t) => t.assigneeId === 'u-d1')).toBe(true);
    const scoped = queryTasks({ ...initialFilters, pageSize: 50, scopeProjectIds: ['p1'] });
    expect(scoped.items.every((t) => t.projectId === 'p1')).toBe(true);
  });

  it('searches title text', () => {
    const page = queryTasks({ ...initialFilters, pageSize: 50, search: 'pipeline' });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((t) => t.title.toLowerCase().includes('pipeline'))).toBe(true);
  });
});

describe('notifications and activity', () => {
  it('notifies a new assignee, but not when assigning to yourself', () => {
    const before = listNotifications('u-d2').length;
    const t = createTask('u-m1', { projectId: 'p1', title: 'X', description: '', status: 'todo', priority: 'low', assigneeId: 'u-d2', dueDate: new Date().toISOString(), subtasks: [] });
    expect(listNotifications('u-d2')).toHaveLength(before + 1);
    updateTask('u-d2', t.id, { assigneeId: 'u-d2' });
    expect(listNotifications('u-d2')).toHaveLength(before + 1);
  });

  it('notifies @mentioned users and the assignee on comments', () => {
    const t = createTask('u-m1', { projectId: 'p1', title: 'Y', description: '', status: 'todo', priority: 'low', assigneeId: 'u-d1', dueDate: new Date().toISOString(), subtasks: [] });
    const mentionsBefore = listNotifications('u-d3').length;
    addComment('u-m1', t.id, 'Looping in @Farid');
    expect(listNotifications('u-d3')).toHaveLength(mentionsBefore + 1);
    expect(listComments(t.id)).toHaveLength(1);
  });
});

describe('role changes', () => {
  it('only lets admins change roles and keeps at least one admin', () => {
    expect(() => updateUser('u-m1', 'u-d1', { role: 'manager' })).toThrow();
    expect(updateUser('u-admin', 'u-d1', { role: 'manager' }).role).toBe('manager');
    expect(() => updateUser('u-admin', 'u-admin', { role: 'member' })).toThrow(/at least one admin/);
  });
});

import { PRIORITY_RANK, STATUS_RANK } from '../constants';
import type { Page, Project, ProjectInput, Task, TaskInput, TaskQuery } from '../types';
import { buildSeed } from './seed';
import { applyMove } from './taskMove';
import type { TaskStatus } from '../types';

/**
 * In-browser stand-in for a backend. Data is persisted to localStorage and is
 * always replaced immutably, because Redux Toolkit freezes values it caches.
 */
interface Db {
  projects: Project[];
  tasks: Task[];
}

const KEY = 'pm-db-v1';

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    // fall through to seed data
  }
  return buildSeed();
}

let db: Db = load();

function commit(next: Db) {
  db = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // storage full or unavailable: keep working in memory
  }
}

let counter = Date.now();
const newId = (prefix: string) => `${prefix}-${(counter++).toString(36)}`;

export const resetDb = () => {
  localStorage.removeItem(KEY);
  db = buildSeed();
};

// ---- Projects ----
export const listProjects = () => db.projects;

export function createProject(input: ProjectInput): Project {
  const project: Project = { ...input, id: newId('p') };
  commit({ ...db, projects: [...db.projects, project] });
  return project;
}

export function updateProject(id: string, patch: Partial<ProjectInput>): Project {
  const existing = db.projects.find((p) => p.id === id);
  if (!existing) throw new Error('Project not found');
  const updated = { ...existing, ...patch };
  commit({ ...db, projects: db.projects.map((p) => (p.id === id ? updated : p)) });
  return updated;
}

export function deleteProject(id: string) {
  commit({ projects: db.projects.filter((p) => p.id !== id), tasks: db.tasks.filter((t) => t.projectId !== id) });
}

// ---- Tasks ----
export const listTasks = (projectId?: string) =>
  projectId ? db.tasks.filter((t) => t.projectId === projectId) : db.tasks;

export function createTask(input: TaskInput): Task {
  const order = db.tasks.filter((t) => t.projectId === input.projectId && t.status === input.status).length;
  const task: Task = {
    ...input,
    id: newId('t'),
    createdAt: new Date().toISOString(),
    completedAt: input.status === 'done' ? new Date().toISOString() : undefined,
    order,
  };
  commit({ ...db, tasks: [...db.tasks, task] });
  return task;
}

export function updateTask(id: string, patch: Partial<TaskInput>): Task {
  const existing = db.tasks.find((t) => t.id === id);
  if (!existing) throw new Error('Task not found');
  let updated: Task = { ...existing, ...patch };
  if (patch.status && patch.status !== existing.status) {
    // Changing status through the form appends the task to the end of the new column.
    const end = db.tasks.filter((t) => t.projectId === existing.projectId && t.status === patch.status).length;
    updated = {
      ...updated,
      order: end,
      completedAt: patch.status === 'done' ? new Date().toISOString() : undefined,
    };
  }
  commit({ ...db, tasks: db.tasks.map((t) => (t.id === id ? updated : t)) });
  return updated;
}

export function moveTask(id: string, status: TaskStatus, index: number) {
  commit({ ...db, tasks: applyMove(db.tasks, id, status, index) });
}

export function deleteTask(id: string) {
  commit({ ...db, tasks: db.tasks.filter((t) => t.id !== id) });
}

/** Server-style filter + sort + paginate. */
export function queryTasks(q: TaskQuery): Page<Task> {
  const search = q.search.trim().toLowerCase();

  const filtered = db.tasks.filter((t) => {
    if (q.scopeUserId && t.assigneeId !== q.scopeUserId) return false;
    if (q.scopeProjectIds && !q.scopeProjectIds.includes(t.projectId)) return false;
    if (q.projectId !== 'all' && t.projectId !== q.projectId) return false;
    if (q.statuses.length && !q.statuses.includes(t.status)) return false;
    if (q.priorities.length && !q.priorities.includes(t.priority)) return false;
    if (q.assigneeId === 'unassigned') {
      if (t.assigneeId !== null) return false;
    } else if (q.assigneeId !== 'all' && t.assigneeId !== q.assigneeId) {
      return false;
    }
    if (search && !`${t.title} ${t.description}`.toLowerCase().includes(search)) return false;
    return true;
  });

  const dir = q.sortDir === 'asc' ? 1 : -1;
  const compare = (a: Task, b: Task): number => {
    switch (q.sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'status':
        return STATUS_RANK[a.status] - STATUS_RANK[b.status];
      case 'priority':
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      case 'dueDate':
        return a.dueDate.localeCompare(b.dueDate);
      case 'createdAt':
        return a.createdAt.localeCompare(b.createdAt);
    }
  };
  const sorted = [...filtered].sort((a, b) => compare(a, b) * dir || a.id.localeCompare(b.id));

  const start = q.page * q.pageSize;
  return { items: sorted.slice(start, start + q.pageSize), total: sorted.length };
}

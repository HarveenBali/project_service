import { PRIORITY_RANK, STATUS_RANK } from '../../constants';
import type { Comment, Page, Task, TaskInput, TaskQuery, TaskStatus } from '../../types';
import { commit, getState, logActivity, newId, pushNotification } from './state';
import type { DbState } from './seed';
import { applyMove } from './taskMove';

export const listTasks = (projectId?: string) =>
  projectId ? getState().tasks.filter((t) => t.projectId === projectId) : getState().tasks;

const actorName = (s: DbState, id: string) => s.users.find((u) => u.id === id)?.name ?? 'Someone';

/** Notifies the new assignee (unless they assigned the task to themselves). */
function notifyAssignment(s: DbState, actorId: string, task: Task): DbState {
  if (!task.assigneeId || task.assigneeId === actorId) return s;
  return pushNotification(s, {
    userId: task.assigneeId,
    message: `${actorName(s, actorId)} assigned you "${task.title}"`,
    link: `/tasks?open=${task.id}`,
  });
}

export function createTask(actorId: string, input: TaskInput): Task {
  const s = getState();
  const task: Task = {
    ...input,
    id: newId('t'),
    createdAt: new Date().toISOString(),
    completedAt: input.status === 'done' ? new Date().toISOString() : undefined,
    order: s.tasks.filter((t) => t.projectId === input.projectId && t.status === input.status).length,
  };
  let next: DbState = { ...s, tasks: [...s.tasks, task] };
  next = logActivity(next, { actorId, message: `created task "${task.title}"`, projectId: task.projectId, taskId: task.id });
  commit(notifyAssignment(next, actorId, task));
  return task;
}

export function updateTask(actorId: string, id: string, patch: Partial<TaskInput>): Task {
  const s = getState();
  const existing = s.tasks.find((t) => t.id === id);
  if (!existing) throw new Error('Task not found.');
  let updated: Task = { ...existing, ...patch };
  if (patch.status && patch.status !== existing.status) {
    // Changing status outside the board appends the task to the end of the new column.
    updated = {
      ...updated,
      order: s.tasks.filter((t) => t.projectId === existing.projectId && t.status === patch.status).length,
      completedAt: patch.status === 'done' ? new Date().toISOString() : undefined,
    };
  }
  let next: DbState = { ...s, tasks: s.tasks.map((t) => (t.id === id ? updated : t)) };
  if (patch.status && patch.status !== existing.status) {
    next = logActivity(next, {
      actorId, message: `moved "${updated.title}" to ${patch.status.replace('_', ' ')}`, projectId: updated.projectId, taskId: id,
    });
  }
  if (patch.assigneeId !== undefined && patch.assigneeId !== existing.assigneeId) {
    next = notifyAssignment(next, actorId, updated);
  }
  commit(next);
  return updated;
}

export function moveTask(actorId: string, id: string, status: TaskStatus, index: number) {
  const s = getState();
  const task = s.tasks.find((t) => t.id === id);
  if (!task) throw new Error('Task not found.');
  let next: DbState = { ...s, tasks: applyMove(s.tasks, id, status, index) };
  if (task.status !== status) {
    next = logActivity(next, {
      actorId, message: `moved "${task.title}" to ${status.replace('_', ' ')}`, projectId: task.projectId, taskId: id,
    });
  }
  commit(next);
}

export function deleteTask(actorId: string, id: string) {
  const s = getState();
  const task = s.tasks.find((t) => t.id === id);
  if (!task) throw new Error('Task not found.');
  commit(logActivity({
    ...s,
    tasks: s.tasks.filter((t) => t.id !== id),
    comments: s.comments.filter((c) => c.taskId !== id),
  }, { actorId, message: `deleted task "${task.title}"`, projectId: task.projectId }));
}

// ---- Comments ----
export const listComments = (taskId: string): Comment[] =>
  getState().comments.filter((c) => c.taskId === taskId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

export function addComment(actorId: string, taskId: string, body: string): Comment {
  const s = getState();
  const task = s.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error('Task not found.');
  const comment: Comment = { id: newId('c'), taskId, authorId: actorId, body: body.trim(), createdAt: new Date().toISOString() };
  let next: DbState = { ...s, comments: [...s.comments, comment] };
  const author = actorName(s, actorId);
  const notified = new Set<string>([actorId]);

  // @FirstName mentions
  for (const [, handle] of body.matchAll(/@([A-Za-z]+)/g)) {
    const target = s.users.find((u) => u.name.split(' ')[0].toLowerCase() === handle.toLowerCase());
    if (target && !notified.has(target.id)) {
      notified.add(target.id);
      next = pushNotification(next, { userId: target.id, message: `${author} mentioned you on "${task.title}"`, link: `/tasks?open=${taskId}` });
    }
  }
  // Tell the assignee about comments they were not mentioned in.
  if (task.assigneeId && !notified.has(task.assigneeId)) {
    next = pushNotification(next, { userId: task.assigneeId, message: `${author} commented on "${task.title}"`, link: `/tasks?open=${taskId}` });
  }
  commit(logActivity(next, { actorId, message: `commented on "${task.title}"`, projectId: task.projectId, taskId }));
  return comment;
}

// ---- Server-style filter + sort + paginate ----
export function queryTasks(q: TaskQuery): Page<Task> {
  const search = q.search.trim().toLowerCase();
  const filtered = getState().tasks.filter((t) => {
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
    return !search || `${t.title} ${t.description}`.toLowerCase().includes(search);
  });

  const dir = q.sortDir === 'asc' ? 1 : -1;
  const compare = (a: Task, b: Task): number => {
    switch (q.sortBy) {
      case 'title': return a.title.localeCompare(b.title);
      case 'status': return STATUS_RANK[a.status] - STATUS_RANK[b.status];
      case 'priority': return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      case 'dueDate': return a.dueDate.localeCompare(b.dueDate);
      case 'createdAt': return a.createdAt.localeCompare(b.createdAt);
    }
  };
  const sorted = [...filtered].sort((a, b) => compare(a, b) * dir || a.id.localeCompare(b.id));
  const start = q.page * q.pageSize;
  return { items: sorted.slice(start, start + q.pageSize), total: sorted.length };
}

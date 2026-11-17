import type { Role, Task, User } from '../types';

export type Action =
  | 'project:create'
  | 'project:edit'
  | 'project:delete'
  | 'task:create'
  | 'task:assign'
  | 'task:delete'
  | 'analytics:view'
  | 'team:view'
  | 'team:manage';

export const PERMISSION_MATRIX: Record<Role, Action[]> = {
  admin: ['project:create', 'project:edit', 'project:delete', 'task:create', 'task:assign', 'task:delete', 'analytics:view', 'team:view', 'team:manage'],
  manager: ['project:create', 'project:edit', 'task:create', 'task:assign', 'task:delete', 'analytics:view', 'team:view'],
  member: [],
};

export const ALL_ACTIONS: Action[] = PERMISSION_MATRIX.admin;

export const can = (role: Role, action: Action) => PERMISSION_MATRIX[role].includes(action);

/** Members may only work on (move / change status of) tasks assigned to them. */
export const canWorkOnTask = (user: User, task: Task) => user.role !== 'member' || task.assigneeId === user.id;

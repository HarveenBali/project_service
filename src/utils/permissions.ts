import type { Role, Task, User } from '../types';

export type Action =
  | 'project:create'
  | 'project:edit'
  | 'project:delete'
  | 'task:create'
  | 'task:assign'
  | 'task:delete'
  | 'analytics:view'
  | 'team:view';

const MATRIX: Record<Role, Action[]> = {
  admin: ['project:create', 'project:edit', 'project:delete', 'task:create', 'task:assign', 'task:delete', 'analytics:view', 'team:view'],
  manager: ['project:create', 'project:edit', 'task:create', 'task:assign', 'task:delete', 'analytics:view'],
  member: [],
};

export const can = (role: Role, action: Action) => MATRIX[role].includes(action);

/** Members may only work on (move / change status of) tasks assigned to them. */
export const canWorkOnTask = (user: User, task: Task) => user.role !== 'member' || task.assigneeId === user.id;

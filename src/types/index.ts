export type Role = 'admin' | 'manager' | 'member';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';
export type SortDir = 'asc' | 'desc';
export type TaskSortKey = 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: string;
  memberIds: string[];
  startDate: string;
  endDate: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  subtasks: Subtask[];
  /** Position inside its project + status column. */
  order: number;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  actorId: string;
  message: string;
  createdAt: string;
  projectId?: string;
  taskId?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  read: boolean;
  /** In-app path opened when the notification is clicked. */
  link?: string;
}

export interface Session {
  user: User;
  /** Epoch milliseconds. */
  expiresAt: number;
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'order'>;
export type ProjectInput = Omit<Project, 'id'>;

/** `'all'` means no filter. assigneeId may also be `'unassigned'`. */
export interface TaskFilters {
  search: string;
  statuses: TaskStatus[];
  priorities: Priority[];
  assigneeId: string;
  projectId: string;
  sortBy: TaskSortKey;
  sortDir: SortDir;
  page: number;
  pageSize: number;
}

export interface TaskQuery extends TaskFilters {
  /** Restrict to tasks assigned to this user (member scope). */
  scopeUserId?: string;
  /** Restrict to tasks in these projects (manager scope). */
  scopeProjectIds?: string[];
}

export interface Page<T> {
  items: T[];
  total: number;
}

export interface ApiError {
  message: string;
}

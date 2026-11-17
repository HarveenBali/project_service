import { actorOf, baseApi, run } from '../../services/api';
import * as tasksDb from '../../services/mock/tasksDb';
import { applyMove } from '../../services/mock/taskMove';
import type { Comment, Page, Task, TaskInput, TaskQuery, TaskStatus } from '../../types';

export interface MoveTaskArg {
  id: string;
  projectId: string;
  status: TaskStatus;
  index: number;
}

/** Applies a partial update to one task the same way the mock server does. */
export function applyPatch(tasks: Task[], id: string, patch: Partial<TaskInput>): Task[] {
  const current = tasks.find((t) => t.id === id);
  if (!current) return tasks;
  const moved =
    patch.status && patch.status !== current.status
      ? applyMove(tasks, id, patch.status, Number.MAX_SAFE_INTEGER)
      : tasks;
  return moved.map((t) => (t.id === id ? { ...t, ...patch } : t));
}

export const tasksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** All tasks, or the tasks of one project. */
    getTasks: build.query<Task[], string | void>({
      queryFn: (projectId) => run(() => tasksDb.listTasks(projectId || undefined)),
      providesTags: (result, _e, projectId) => [
        { type: 'Task', id: 'LIST' },
        ...(projectId ? [] : [{ type: 'Task' as const, id: 'AGG' }]),
        ...(result ?? []).map((t) => ({ type: 'Task' as const, id: t.id })),
      ],
    }),
    /** Server-side filtered, sorted and paginated task page. */
    searchTasks: build.query<Page<Task>, TaskQuery>({
      queryFn: (query) => run(() => tasksDb.queryTasks(query)),
      providesTags: () => [
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'AGG' },
      ],
    }),
    createTask: build.mutation<Task, TaskInput>({
      queryFn: (input, api) => run(() => tasksDb.createTask(actorOf(api), input)),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }, { type: 'Activity', id: 'LIST' }, { type: 'Notification', id: 'LIST' }],
    }),
    /** Status and assignment edits show instantly and roll back if the request fails. */
    updateTask: build.mutation<Task, { id: string; projectId: string; patch: Partial<TaskInput> }>({
      queryFn: ({ id, patch }, api) => run(() => tasksDb.updateTask(actorOf(api), id, patch)),
      async onQueryStarted({ id, projectId, patch }, { dispatch, queryFulfilled }) {
        const undo = [projectId, undefined].map((arg) =>
          dispatch(tasksApi.util.updateQueryData('getTasks', arg, (draft) => applyPatch(draft, id, patch))),
        );
        try {
          await queryFulfilled;
        } catch {
          undo.forEach((p) => p.undo());
        }
      },
      invalidatesTags: [{ type: 'Task', id: 'LIST' }, { type: 'Activity', id: 'LIST' }, { type: 'Notification', id: 'LIST' }],
    }),
    deleteTask: build.mutation<void, string>({
      queryFn: (id, api) => run(() => tasksDb.deleteTask(actorOf(api), id)),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }, { type: 'Activity', id: 'LIST' }],
    }),
    /** Drag-and-drop: the board is patched optimistically and rolled back on error. */
    moveTask: build.mutation<void, MoveTaskArg>({
      queryFn: ({ id, status, index }, api) => run(() => tasksDb.moveTask(actorOf(api), id, status, index)),
      async onQueryStarted({ id, projectId, status, index }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          tasksApi.util.updateQueryData('getTasks', projectId, (draft) => applyMove(draft, id, status, index)),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_r, error) =>
        error
          ? [{ type: 'Task', id: 'LIST' }]
          : [{ type: 'Task', id: 'AGG' }, { type: 'Activity', id: 'LIST' }],
    }),

    getComments: build.query<Comment[], string>({
      queryFn: (taskId) => run(() => tasksDb.listComments(taskId)),
      providesTags: (_r, _e, taskId) => [{ type: 'Comment', id: taskId }],
    }),
    addComment: build.mutation<Comment, { taskId: string; body: string }>({
      queryFn: ({ taskId, body }, api) => run(() => tasksDb.addComment(actorOf(api), taskId, body)),
      invalidatesTags: (_r, _e, { taskId }) => [
        { type: 'Comment', id: taskId },
        { type: 'Activity', id: 'LIST' },
        { type: 'Notification', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useSearchTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
} = tasksApi;

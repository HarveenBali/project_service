import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { QueryReturnValue } from '@reduxjs/toolkit/query';
import * as db from '../mock/db';
import { applyMove } from '../mock/taskMove';
import { USERS } from '../mock/seed';
import type { ApiError, Page, Project, ProjectInput, Task, TaskInput, TaskQuery, TaskStatus, User } from '../types';

const LATENCY_MS = 200;

/** Runs a mock-server call with simulated latency and error mapping. */
async function run<T>(fn: () => T): Promise<QueryReturnValue<T, ApiError, undefined>> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  try {
    return { data: fn() };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : 'Unexpected error' } };
  }
}

export interface MoveTaskArg {
  id: string;
  projectId: string;
  status: TaskStatus;
  index: number;
}

/**
 * Tag strategy:
 *  - 'LIST'  provided by every collection query; invalidated by create/update/delete.
 *  - 'AGG'   provided only by cross-project queries (dashboard, analytics, task table).
 *            Drag-and-drop invalidates this instead of 'LIST', so the board that
 *            was already updated optimistically is not refetched.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<ApiError>(),
  tagTypes: ['Project', 'Task'],
  keepUnusedDataFor: 120,
  refetchOnReconnect: true,
  endpoints: (build) => ({
    getUsers: build.query<User[], void>({
      queryFn: () => run(() => USERS),
      keepUnusedDataFor: 3600,
    }),

    getProjects: build.query<Project[], void>({
      queryFn: () => run(() => db.listProjects()),
      providesTags: (result) => [
        { type: 'Project', id: 'LIST' },
        ...(result ?? []).map((p) => ({ type: 'Project' as const, id: p.id })),
      ],
    }),
    createProject: build.mutation<Project, ProjectInput>({
      queryFn: (input) => run(() => db.createProject(input)),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }],
    }),
    updateProject: build.mutation<Project, { id: string; patch: Partial<ProjectInput> }>({
      queryFn: ({ id, patch }) => run(() => db.updateProject(id, patch)),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Project', id }, { type: 'Project', id: 'LIST' }],
    }),
    deleteProject: build.mutation<void, string>({
      queryFn: (id) => run(() => db.deleteProject(id)),
      invalidatesTags: [
        { type: 'Project', id: 'LIST' },
        { type: 'Task', id: 'LIST' },
      ],
    }),

    /** All tasks, or the tasks of one project. */
    getTasks: build.query<Task[], string | void>({
      queryFn: (projectId) => run(() => db.listTasks(projectId || undefined)),
      providesTags: (result, _e, projectId) => [
        { type: 'Task', id: 'LIST' },
        ...(projectId ? [] : [{ type: 'Task' as const, id: 'AGG' }]),
        ...(result ?? []).map((t) => ({ type: 'Task' as const, id: t.id })),
      ],
    }),
    /** Server-side filtered, sorted and paginated task page. */
    searchTasks: build.query<Page<Task>, TaskQuery>({
      queryFn: (query) => run(() => db.queryTasks(query)),
      providesTags: () => [
        { type: 'Task', id: 'LIST' },
        { type: 'Task', id: 'AGG' },
      ],
    }),
    createTask: build.mutation<Task, TaskInput>({
      queryFn: (input) => run(() => db.createTask(input)),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    updateTask: build.mutation<Task, { id: string; patch: Partial<TaskInput> }>({
      queryFn: ({ id, patch }) => run(() => db.updateTask(id, patch)),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    deleteTask: build.mutation<void, string>({
      queryFn: (id) => run(() => db.deleteTask(id)),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    /** Drag-and-drop: the board is patched optimistically and rolled back on error. */
    moveTask: build.mutation<void, MoveTaskArg>({
      queryFn: ({ id, status, index }) => run(() => db.moveTask(id, status, index)),
      async onQueryStarted({ id, projectId, status, index }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          api.util.updateQueryData('getTasks', projectId, (draft) => applyMove(draft, id, status, index)),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_r, error) => (error ? [{ type: 'Task', id: 'LIST' }] : [{ type: 'Task', id: 'AGG' }]),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetTasksQuery,
  useSearchTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
} = api;

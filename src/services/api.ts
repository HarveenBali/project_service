import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { QueryReturnValue } from '@reduxjs/toolkit/query';
import type { ApiError, Session } from '../types';

const LATENCY_MS = 150;

/**
 * Shared RTK Query API. Each feature adds its own endpoints with
 * `baseApi.injectEndpoints`, so features stay self-contained.
 *
 * Tag strategy:
 *  - 'LIST' (per type) is provided by every collection query and invalidated by writes.
 *  - Task 'AGG' is provided only by cross-project queries (dashboard, reports, task grid).
 *    Drag-and-drop invalidates it instead of 'LIST', so a board that was already updated
 *    optimistically is not refetched.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<ApiError>(),
  tagTypes: ['Project', 'Task', 'User', 'Comment', 'Activity', 'Notification'],
  keepUnusedDataFor: 120,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});

/** Runs a mock-server call with simulated latency and error mapping. */
export async function run<T>(fn: () => T): Promise<QueryReturnValue<T, ApiError, undefined>> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  try {
    return { data: fn() };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : 'Unexpected error' } };
  }
}

/** Id of the signed-in user, read from the store without importing it (avoids a cycle). */
export const actorOf = (api: { getState: () => unknown }): string =>
  (api.getState() as { auth: { session: Session | null } }).auth.session?.user.id ?? '';

export const errorMessage = (e: unknown, fallback = 'Something went wrong.') =>
  (e as { message?: string } | null)?.message ?? fallback;

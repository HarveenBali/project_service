import { baseApi, run } from '../../services/api';
import * as miscDb from '../../services/mock/miscDb';
import type { Activity, AppNotification, Session } from '../../types';

const userOf = (api: { getState: () => unknown }) =>
  (api.getState() as { auth: { session: Session | null } }).auth.session?.user.id ?? '';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<AppNotification[], void>({
      queryFn: (_arg, api) => run(() => miscDb.listNotifications(userOf(api))),
      providesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    markNotificationsRead: build.mutation<void, string | void>({
      queryFn: (id, api) => run(() => miscDb.markNotifications(userOf(api), id || undefined)),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          notificationsApi.util.updateQueryData('getNotifications', undefined, (draft) =>
            draft.map((n) => (!id || n.id === id ? { ...n, read: true } : n)),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
    getActivity: build.query<Activity[], number>({
      queryFn: (limit) => run(() => miscDb.listActivity(limit)),
      providesTags: [{ type: 'Activity', id: 'LIST' }],
    }),
  }),
});

export const { useGetNotificationsQuery, useMarkNotificationsReadMutation, useGetActivityQuery } = notificationsApi;

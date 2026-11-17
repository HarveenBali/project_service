import { actorOf, baseApi, run } from '../../services/api';
import * as miscDb from '../../services/mock/miscDb';
import type { Role, User } from '../../types';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<User[], void>({
      queryFn: () => run(() => miscDb.listUsers()),
      providesTags: [{ type: 'User', id: 'LIST' }],
      keepUnusedDataFor: 600,
    }),
    updateUser: build.mutation<User, { id: string; patch: { name?: string; role?: Role } }>({
      queryFn: ({ id, patch }, api) => run(() => miscDb.updateUser(actorOf(api), id, patch)),
      invalidatesTags: [{ type: 'User', id: 'LIST' }, { type: 'Activity', id: 'LIST' }],
    }),
  }),
});

export const { useGetUsersQuery, useUpdateUserMutation } = usersApi;

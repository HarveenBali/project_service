import { baseApi, run } from '../../services/api';
import * as authDb from '../../services/mock/authDb';
import type { Session } from '../../types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<Session, { email: string; password: string }>({
      queryFn: ({ email, password }) => run(() => authDb.login(email, password)),
    }),
    signup: build.mutation<Session, { name: string; email: string; password: string }>({
      queryFn: ({ name, email, password }) => run(() => authDb.signup(name, email, password)),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    requestPasswordReset: build.mutation<void, { email: string }>({
      queryFn: ({ email }) => run(() => authDb.requestPasswordReset(email)),
    }),
  }),
});

export const { useLoginMutation, useSignupMutation, useRequestPasswordResetMutation } = authApi;

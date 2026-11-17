import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { baseApi } from '../services/api';
import { sessionExpired, signedOut } from '../features/auth/authSlice';

/** Current session, plus sign-out. Ends the session automatically when it expires. */
export function useAuth() {
  const session = useAppSelector((s) => s.auth.session);
  const dispatch = useAppDispatch();

  const signOut = useCallback(() => {
    dispatch(signedOut());
    // Drop cached server data so the next user never sees the previous user's data.
    dispatch(baseApi.util.resetApiState());
  }, [dispatch]);

  const expiresAt = session?.expiresAt;
  useEffect(() => {
    if (!expiresAt) return;
    const id = setTimeout(() => {
      dispatch(sessionExpired());
      dispatch(baseApi.util.resetApiState());
    }, Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(id);
  }, [expiresAt, dispatch]);

  return { session, user: session?.user ?? null, isAuthenticated: !!session, signOut };
}

/** For components rendered only inside the authenticated area. */
export function useCurrentUser() {
  const user = useAppSelector((s) => s.auth.session?.user);
  if (!user) throw new Error('useCurrentUser must be used inside an authenticated route');
  return user;
}

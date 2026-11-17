import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Session, User } from '../../types';

const KEY = 'flowsync-session';

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

const persist = (session: Session | null) => {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    // storage unavailable
  }
};

interface AuthState {
  session: Session | null;
  /** Set when a session ends because it timed out, so the login page can say so. */
  expired: boolean;
}

const slice = createSlice({
  name: 'auth',
  initialState: { session: loadSession(), expired: false } as AuthState,
  reducers: {
    signedIn(state, action: PayloadAction<Session>) {
      state.session = action.payload;
      state.expired = false;
      persist(action.payload);
    },
    signedOut(state) {
      state.session = null;
      state.expired = false;
      persist(null);
    },
    sessionExpired(state) {
      state.session = null;
      state.expired = true;
      persist(null);
    },
    profileUpdated(state, action: PayloadAction<User>) {
      if (!state.session) return;
      state.session.user = action.payload;
      persist(state.session);
    },
  },
});

export const { signedIn, signedOut, sessionExpired, profileUpdated } = slice.actions;
export default slice.reducer;

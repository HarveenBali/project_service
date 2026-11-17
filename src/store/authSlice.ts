import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { USERS } from '../mock/seed';
import type { User } from '../types';

const KEY = 'pm-user';

function initialUser(): User {
  const id = localStorage.getItem(KEY);
  return USERS.find((u) => u.id === id) ?? USERS[0];
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: initialUser() },
  reducers: {
    // "Sign in as" switcher: there is no real authentication in this demo.
    switchUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      localStorage.setItem(KEY, action.payload.id);
    },
  },
});

export const { switchUser } = authSlice.actions;
export default authSlice.reducer;

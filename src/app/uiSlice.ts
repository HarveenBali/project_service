import { createSlice, nanoid } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type ToastSeverity = 'success' | 'danger' | 'warning' | 'neutral';

export interface Toast {
  id: string;
  message: string;
  severity: ToastSeverity;
}

const COLLAPSED_KEY = 'flowsync-sidebar-collapsed';

const slice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: localStorage.getItem(COLLAPSED_KEY) === '1',
    paletteOpen: false,
    toasts: [] as Toast[],
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem(COLLAPSED_KEY, state.sidebarCollapsed ? '1' : '0');
    },
    setPaletteOpen(state, action: PayloadAction<boolean>) {
      state.paletteOpen = action.payload;
    },
    toast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload);
        if (state.toasts.length > 4) state.toasts.shift();
      },
      prepare(message: string, severity: ToastSeverity = 'success') {
        return { payload: { id: nanoid(), message, severity } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toggleSidebar, setPaletteOpen, toast, dismissToast } = slice.actions;
export default slice.reducer;

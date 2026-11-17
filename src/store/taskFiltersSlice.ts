import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TaskFilters, TaskSortKey } from '../types';

export const initialFilters: TaskFilters = {
  search: '',
  statuses: [],
  priorities: [],
  assigneeId: 'all',
  projectId: 'all',
  sortBy: 'dueDate',
  sortDir: 'asc',
  page: 0,
  pageSize: 10,
};

const slice = createSlice({
  name: 'taskFilters',
  initialState: initialFilters,
  reducers: {
    /** Any filter change returns to page 0 unless a page is given explicitly. */
    patchFilters(state, action: PayloadAction<Partial<TaskFilters>>) {
      Object.assign(state, { page: 0 }, action.payload);
    },
    toggleSort(state, action: PayloadAction<TaskSortKey>) {
      if (state.sortBy === action.payload) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortBy = action.payload;
        state.sortDir = 'asc';
      }
      state.page = 0;
    },
    resetFilters: () => initialFilters,
  },
});

export const { patchFilters, toggleSort, resetFilters } = slice.actions;
export default slice.reducer;

export const hasActiveFilters = (f: TaskFilters) =>
  f.search !== '' || f.statuses.length > 0 || f.priorities.length > 0 || f.assigneeId !== 'all' || f.projectId !== 'all';

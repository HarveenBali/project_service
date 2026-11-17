import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '../features/auth/authSlice';
import taskFiltersReducer from '../features/tasks/taskFiltersSlice';
import { baseApi } from '../services/api';
import uiReducer from './uiSlice';
// Feature endpoints register themselves on the shared API when imported.
import '../features/auth/authApi';
import '../features/notifications/notificationsApi';
import '../features/projects/projectsApi';
import '../features/tasks/tasksApi';
import '../features/team/usersApi';

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  taskFilters: taskFiltersReducer,
  ui: uiReducer,
});

export const makeStore = (preloadedState?: Partial<ReturnType<typeof rootReducer>>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });

export const store = makeStore();
setupListeners(store.dispatch);

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];

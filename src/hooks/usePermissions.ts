import { useMemo } from 'react';
import { useCurrentUser } from './useAuth';
import { can as check, canWorkOnTask } from '../utils/permissions';
import type { Action } from '../utils/permissions';
import type { Task } from '../types';

export function usePermissions() {
  const user = useCurrentUser();
  return useMemo(
    () => ({
      role: user.role,
      can: (action: Action) => check(user.role, action),
      canWorkOn: (task: Task) => canWorkOnTask(user, task),
    }),
    [user],
  );
}

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import type { Action } from '../utils/permissions';
import { can } from '../utils/permissions';

/** Redirects to the dashboard when the current role lacks the required permission. */
export function RoleGuard({ requires, children }: { requires: Action; children: ReactNode }) {
  const role = useAppSelector((s) => s.auth.user.role);
  return can(role, requires) ? <>{children}</> : <Navigate to="/" replace />;
}

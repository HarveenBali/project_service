import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { usePermissions } from '../../hooks/usePermissions';
import type { Action } from '../../utils/permissions';

/** Layout route: renders children only for signed-in users, otherwise redirects to /login. */
export function ProtectedRoute() {
  const session = useAppSelector((s) => s.auth.session);
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Redirects to the dashboard when the current role lacks the required permission. */
export function RequirePermission({ action, children }: { action: Action; children: ReactNode }) {
  const { can } = usePermissions();
  return can(action) ? <>{children}</> : <Navigate to="/" replace />;
}

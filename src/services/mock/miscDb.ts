import type { Activity, AppNotification, Role, User } from '../../types';
import { commit, getState, logActivity, publicUser } from './state';

export const listUsers = (): User[] => getState().users.map(publicUser);

export function updateUser(actorId: string, id: string, patch: { name?: string; role?: Role }): User {
  const s = getState();
  const existing = s.users.find((u) => u.id === id);
  if (!existing) throw new Error('User not found.');
  const actor = s.users.find((u) => u.id === actorId);
  const isSelf = actorId === id;
  // Only admins can change roles; anyone may edit their own name.
  if (patch.role && patch.role !== existing.role && actor?.role !== 'admin') throw new Error('Only admins can change roles.');
  if (!isSelf && actor?.role !== 'admin') throw new Error('You cannot edit other users.');
  if (patch.role && isSelf && patch.role !== 'admin' && existing.role === 'admin'
    && s.users.filter((u) => u.role === 'admin').length === 1) {
    throw new Error('The workspace needs at least one admin.');
  }
  const updated = { ...existing, ...patch };
  let next = { ...s, users: s.users.map((u) => (u.id === id ? updated : u)) };
  if (patch.role && patch.role !== existing.role) {
    next = logActivity(next, { actorId, message: `changed ${existing.name}'s role to ${patch.role}` });
  }
  commit(next);
  return publicUser(updated);
}

export const listActivity = (limit: number): Activity[] => getState().activity.slice(0, limit);

export const listNotifications = (userId: string): AppNotification[] =>
  getState().notifications.filter((n) => n.userId === userId);

export function markNotifications(userId: string, id?: string) {
  const s = getState();
  commit({
    ...s,
    notifications: s.notifications.map((n) => (n.userId === userId && (!id || n.id === id) ? { ...n, read: true } : n)),
  });
}

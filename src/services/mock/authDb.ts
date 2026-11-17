import { SESSION_HOURS } from '../../constants';
import type { Role, Session } from '../../types';
import { commit, getState, newId, publicUser } from './state';

const sessionFor = (user: ReturnType<typeof publicUser>): Session => ({
  user,
  expiresAt: Date.now() + SESSION_HOURS * 3_600_000,
});

export function login(email: string, password: string): Session {
  const found = getState().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  // One generic message so the form does not reveal which emails exist.
  if (!found || found.password !== password) throw new Error('Invalid email or password.');
  return sessionFor(publicUser(found));
}

export function signup(name: string, email: string, password: string): Session {
  const s = getState();
  if (s.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }
  const created = { id: newId('u'), name: name.trim(), email: email.trim().toLowerCase(), role: 'member' as Role, password };
  commit({ ...s, users: [...s.users, created] });
  return sessionFor(publicUser(created));
}

/** Always succeeds, so the response does not reveal whether the email is registered. */
export function requestPasswordReset(_email: string): void {
  // A real backend would send an email with a single-use token here.
}

export function refreshSession(userId: string): Session {
  const found = getState().users.find((u) => u.id === userId);
  if (!found) throw new Error('Session is no longer valid.');
  return sessionFor(publicUser(found));
}

import type { Activity, AppNotification } from '../../types';
import { buildSeed } from './buildSeed';
import type { DbState } from './seed';

/**
 * In-browser stand-in for a backend. State is persisted to localStorage and is
 * always replaced immutably, because Redux Toolkit freezes values it caches.
 */
const KEY = 'flowsync-db-v1';

function load(): DbState {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DbState;
  } catch {
    // fall through to seed data
  }
  return buildSeed();
}

let state: DbState = load();

export const getState = () => state;

export function commit(next: DbState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable or full: keep working in memory
  }
}

export function resetDb() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  state = buildSeed();
}

let counter = Date.now();
export const newId = (prefix: string) => `${prefix}-${(counter++).toString(36)}`;

export const publicUser = ({ password: _password, ...user }: DbState['users'][number]) => user;

/** Appends an activity entry (kept to the latest 200). */
export function logActivity(s: DbState, entry: Omit<Activity, 'id' | 'createdAt'>): DbState {
  const activity: Activity = { ...entry, id: newId('a'), createdAt: new Date().toISOString() };
  return { ...s, activity: [activity, ...s.activity].slice(0, 200) };
}

export function pushNotification(s: DbState, n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): DbState {
  const note: AppNotification = { ...n, id: newId('n'), createdAt: new Date().toISOString(), read: false };
  return { ...s, notifications: [note, ...s.notifications].slice(0, 300) };
}

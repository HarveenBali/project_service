import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { makeStore } from '../../src/app/store';
import { AppRoutes } from '../../src/app/router';
import { signedIn } from '../../src/features/auth/authSlice';
import * as authDb from '../../src/services/mock/authDb';
import { DEMO_PASSWORD } from '../../src/services/mock/seed';
import { resetDb } from '../../src/services/mock/state';
import { ThemeProviders } from '../../src/theme/ThemeProviders';

// Recharts measures its container; jsdom has no layout engine.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

function renderAt(path: string, email: string) {
  const store = makeStore();
  store.dispatch(signedIn(authDb.login(email, DEMO_PASSWORD)));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <ThemeProviders>
          <AppRoutes />
        </ThemeProviders>
      </MemoryRouter>
    </Provider>,
  );
}

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  resetDb();
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { if (process.env.SHOW_ERRORS) errors.mock.calls.forEach((c) => process.stdout.write('CONSOLE.ERROR: ' + String(c[0]).slice(0, 300) + '\n')); errors.mockRestore(); });

const ADMIN = 'admin@flowsync.dev';
const MANAGER = 'manager@flowsync.dev';
const MEMBER = 'member@flowsync.dev';

describe('every route renders without a runtime error', () => {
  const cases: [string, string, RegExp][] = [
    ['/', ADMIN, /admin dashboard/i],
    ['/', MANAGER, /manager dashboard/i],
    ['/', MEMBER, /member dashboard/i],
    ['/projects', ADMIN, /^projects$/i],
    ['/projects/p1', MANAGER, /customer portal revamp/i],
    ['/tasks', MEMBER, /^tasks$/i],
    ['/team', ADMIN, /^team$/i],
    ['/reports', MANAGER, /^reports$/i],
    ['/settings', MEMBER, /^settings$/i],
  ];

  it.each(cases)('%s as %s', async (path, email, heading) => {
    renderAt(path, email);
    expect(await screen.findByRole('heading', { level: 1, name: heading }, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('keeps members out of admin-only pages', async () => {
    renderAt('/team', MEMBER);
    expect(await screen.findByRole('heading', { level: 1, name: /member dashboard/i }, { timeout: 4000 })).toBeInTheDocument();
  });

  it('shows the app shell navigation filtered by role', async () => {
    renderAt('/', MEMBER);
    await screen.findByRole('heading', { level: 1, name: /member dashboard/i }, { timeout: 4000 });
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav).toHaveTextContent('Tasks');
    expect(nav).not.toHaveTextContent('Reports');
    expect(nav).not.toHaveTextContent('Team');
  });
});

import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeStore } from '../../src/app/store';
import LoginPage from '../../src/features/auth/LoginPage';
import { ProtectedRoute } from '../../src/features/auth/ProtectedRoute';
import { ThemeProviders } from '../../src/theme/ThemeProviders';

function setup(initialPath = '/login') {
  const store = makeStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <ThemeProviders>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<div>Private home</div>} />
            </Route>
          </Routes>
        </ThemeProviders>
      </MemoryRouter>
    </Provider>,
  );
  return { store, user: userEvent.setup() };
}

describe('authentication flow', () => {
  it('redirects signed-out users to the login page', async () => {
    setup('/');
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText('Private home')).not.toBeInTheDocument();
  });

  it('shows validation messages for empty and invalid input', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('shows one generic error for wrong credentials', async () => {
    const { user, store } = setup();
    await user.type(screen.getByLabelText(/email/i), 'admin@flowsync.dev');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(store.getState().auth.session).toBeNull();
  });

  it('signs in with a demo account and opens the protected page', async () => {
    const { user, store } = setup();
    await user.click(screen.getByRole('button', { name: 'Manager' }));
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(store.getState().auth.session?.user.role).toBe('manager'));
    expect(await screen.findByText('Private home')).toBeInTheDocument();
  });
});

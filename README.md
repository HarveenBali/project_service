# FlowSync

Projects. People. Progress. An enterprise-style project and team management app, built from `FlowSync_Project_Blueprint.md`.

React 19, TypeScript, Vite, Joy UI + Material UI (shared design tokens), Redux Toolkit + RTK Query, React Router, MUI X Data Grid, dnd-kit, React Hook Form + Zod, Recharts, Vitest + React Testing Library.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit, component and route smoke tests
npm run build      # type-check + production build
```

There is no backend yet. `src/services/mock/` is an in-browser server that persists to localStorage and adds 150 ms of latency.
Replace the `queryFn`s in each `features/*/…Api.ts` with real HTTP calls to move to a backend.
Settings > Demo data resets the workspace.

## Demo accounts

Password for all: `Demo1234`

| Role | Email |
| --- | --- |
| Admin | admin@flowsync.dev |
| Manager | manager@flowsync.dev |
| Member | member@flowsync.dev |

New sign-ups get the Member role. Admins can change roles on the Team page.

## What is built (blueprint MVP + selected second-release items)

- **Auth:** login, signup, password-reset request, Zod validation, 8-hour sessions with auto-expiry, protected and permission-guarded routes, role-aware navigation.
- **Shell:** collapsible sidebar, breadcrumbs, project switcher, global command palette (Ctrl/Cmd + K), notification centre, light/dark theme, toasts, skeletons, empty and error states with retry, error boundary, skip link.
- **Dashboards:** role-specific KPIs, workload, status, trend, project progress, project health and activity. Widgets can be hidden per user.
- **Projects:** cards with search, filter, sort, pagination, health score (transparent, per-factor breakdown), create/edit/delete, overview and activity tabs.
- **Tasks:** server-style filtering, sorting and pagination in a MUI X Data Grid, task drawer with subtasks and comments (@mentions create notifications), CSV export.
- **Kanban:** dnd-kit board with pointer and keyboard dragging, optimistic moves with rollback.
- **Team:** directory, workload vs capacity, admin role management.
- **Reports:** trend range, drill-down from charts to the filtered task grid, CSV export.
- **Settings:** profile, theme, role/permission matrix.

## Architecture

```
src/
  app/          store, typed hooks, providers, router, UI slice
  components/   common, layout, data-grid, charts, feedback (shared UI only)
  features/     auth, dashboard, projects, tasks, kanban, team, reports, notifications, settings
                (each owns its API endpoints, slice, components and schemas)
  hooks/        useAuth, usePermissions, useDebounce, useLocalPreferences, useScopedData, useToast
  services/     baseApi (RTK Query) and the mock server
  theme/        design tokens, Joy + MUI theme bridge
  types/ constants/ utils/
tests/          unit (Vitest) and e2e (empty, see below)
```

State split: RTK Query owns server data (tag-based invalidation, per-project board cache, optimistic updates).
Redux slices own client state only: session, task filters, sidebar/palette/toasts.

## Not built yet (from the blueprint)

Calendar and timeline views, milestones and task dependencies, recurring tasks, file attachments and shared documents,
workflow automation builder, audit-log screen, AI assistant, gamification, real-time sockets (notifications poll every 15 s),
Excel/PDF export (CSV only), Playwright end-to-end tests, Node/Express/MongoDB backend, drag-to-reorder dashboard widgets,
and an actual password-reset email flow.

## Known limitations

- Passwords are stored in plain text in the mock database. A real backend must hash them.
- Permissions are enforced in the UI and mock server only. A real API must enforce them server-side.
- Accessibility has been built in (labels, focus states, keyboard dragging, live regions) but not audited with a screen reader or axe.
- The Data Grid chunk is about 630 kB (184 kB gzipped). It only loads on the Tasks and Team pages.

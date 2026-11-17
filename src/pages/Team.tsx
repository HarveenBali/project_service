import { useMemo, useState } from 'react';
import Chip from '@mui/joy/Chip';
import Typography from '@mui/joy/Typography';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { UserAvatar } from '../components/UserAvatar';
import { ROLE_LABEL } from '../constants';
import { useScopedData } from '../hooks/useScopedData';
import type { Role, SortDir, User } from '../types';
import { isOverdue } from '../utils/format';

type Row = User & { open: number; done: number; overdue: number };
type SortKey = 'name' | 'role' | 'open' | 'done' | 'overdue';

/** Admin-only view: demonstrates the reusable DataTable with client-side sort/pagination. */
export default function Team() {
  const { users, tasks } = useScopedData();
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const rows = useMemo<Row[]>(
    () =>
      users.map((u) => {
        const mine = tasks.filter((t) => t.assigneeId === u.id);
        return {
          ...u,
          open: mine.filter((t) => t.status !== 'done').length,
          done: mine.filter((t) => t.status === 'done').length,
          overdue: mine.filter((t) => isOverdue(t)).length,
        };
      }),
    [users, tasks],
  );

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      return (typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv))) * dir;
    });
  }, [rows, sortBy, sortDir]);

  const columns: Column<Row, SortKey>[] = [
    { id: 'name', header: 'Name', sortKey: 'name', render: (r) => <UserAvatar user={r} showName /> },
    { id: 'email', header: 'Email', render: (r) => <Typography level="body-sm">{r.email}</Typography> },
    { id: 'role', header: 'Role', sortKey: 'role', render: (r) => <Chip size="sm" variant="soft" color={roleColor[r.role]}>{ROLE_LABEL[r.role]}</Chip> },
    { id: 'open', header: 'Open tasks', sortKey: 'open', render: (r) => r.open },
    { id: 'done', header: 'Completed', sortKey: 'done', render: (r) => r.done },
    { id: 'overdue', header: 'Overdue', sortKey: 'overdue', render: (r) => r.overdue },
  ];

  return (
    <>
      <PageHeader title="Team" subtitle="Everyone in the organisation and their current workload." />
      <DataTable<Row, SortKey>
        columns={columns}
        rows={sorted.slice(page * pageSize, page * pageSize + pageSize)}
        getRowId={(r) => r.id}
        total={sorted.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={(key) => {
          if (key === sortBy) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
          else { setSortBy(key); setSortDir('asc'); }
          setPage(0);
        }}
      />
    </>
  );
}

const roleColor: Record<Role, 'danger' | 'primary' | 'neutral'> = { admin: 'danger', manager: 'primary', member: 'neutral' };

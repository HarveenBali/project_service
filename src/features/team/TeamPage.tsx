import { useMemo } from 'react';
import Chip from '@mui/joy/Chip';
import Option from '@mui/joy/Option';
import Select from '@mui/joy/Select';
import Typography from '@mui/joy/Typography';
import LinearProgress from '@mui/joy/LinearProgress';
import type { GridColDef } from '@mui/x-data-grid';
import { DataGrid } from '@mui/x-data-grid';
import Sheet from '@mui/joy/Sheet';
import { PageHeader } from '../../components/common/PageHeader';
import { UserAvatar } from '../../components/common/UserAvatar';
import { ErrorState } from '../../components/feedback/Feedback';
import { ROLE_LABEL } from '../../constants';
import { usePermissions } from '../../hooks/usePermissions';
import { useScopedData } from '../../hooks/useScopedData';
import { useToast } from '../../hooks/useToast';
import { errorMessage } from '../../services/api';
import type { Role, User } from '../../types';
import { isOverdue } from '../../utils/format';
import { useUpdateUserMutation } from './usersApi';

type Row = User & { open: number; done: number; overdue: number };

/** Capacity is a fixed demo number: a real product would store it per person. */
const CAPACITY = 8;
const roleColor = { admin: 'danger', manager: 'primary', member: 'neutral' } as const;

export default function TeamPage() {
  const { users, tasks, isLoading, isError, refetch } = useScopedData();
  const { can } = usePermissions();
  const [updateUser] = useUpdateUserMutation();
  const toast = useToast();
  const manage = can('team:manage');

  const rows = useMemo<Row[]>(
    () => users.map((u) => {
      const mine = tasks.filter((t) => t.assigneeId === u.id);
      return { ...u, open: mine.filter((t) => t.status !== 'done').length, done: mine.filter((t) => t.status === 'done').length, overdue: mine.filter((t) => isOverdue(t)).length };
    }),
    [users, tasks],
  );

  const changeRole = async (id: string, role: Role) => {
    try {
      await updateUser({ id, patch: { role } }).unwrap();
      toast.show('Role updated');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const columns: GridColDef<Row>[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 180, renderCell: (p) => <UserAvatar user={p.row} showName /> },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'role', headerName: 'Role', width: 160,
      renderCell: (p) => manage ? (
        <Select size="sm" value={p.row.role} onChange={(_e, v) => v && void changeRole(p.row.id, v)} slotProps={{ button: { 'aria-label': `Role for ${p.row.name}` } }}>
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <Option key={r} value={r}>{ROLE_LABEL[r]}</Option>)}
        </Select>
      ) : <Chip size="sm" variant="soft" color={roleColor[p.row.role]}>{ROLE_LABEL[p.row.role]}</Chip>,
    },
    {
      field: 'open', headerName: 'Workload', width: 200,
      renderCell: (p) => (
        <div style={{ width: '100%' }}>
          <Typography level="body-xs">{p.row.open} open / {CAPACITY} capacity</Typography>
          <LinearProgress determinate value={Math.min(100, (p.row.open / CAPACITY) * 100)} color={p.row.open > CAPACITY ? 'danger' : p.row.open > CAPACITY * 0.75 ? 'warning' : 'success'} />
        </div>
      ),
    },
    { field: 'done', headerName: 'Completed', width: 110, type: 'number' },
    { field: 'overdue', headerName: 'Overdue', width: 100, type: 'number' },
  ];

  if (isError) return <ErrorState onRetry={refetch} />;
  return (
    <>
      <PageHeader title="Team" subtitle={manage ? 'Directory, roles and workload. Admins can change roles.' : 'Directory and current workload.'} />
      <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
        <DataGrid<Row>
          aria-label="Team members"
          rows={rows}
          columns={columns}
          loading={isLoading}
          autoHeight
          disableRowSelectionOnClick
          disableColumnMenu
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[5, 10, 25]}
          sx={{ border: 0 }}
        />
      </Sheet>
    </>
  );
}

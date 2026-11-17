import type { ReactNode } from 'react';
import LinearProgress from '@mui/joy/LinearProgress';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import type { SortDir } from '../types';

export interface Column<T, K extends string = string> {
  id: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Sort key sent to `onSort`; omit for non-sortable columns. */
  sortKey?: K;
  width?: number | string;
}

interface Props<T, K extends string> {
  columns: Column<T, K>[];
  rows: T[];
  getRowId: (row: T) => string;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortBy?: K;
  sortDir?: SortDir;
  onSort?: (key: K) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyText?: string;
}

/** Controlled, server-friendly table: the parent owns sorting and pagination state. */
export function DataTable<T, K extends string = string>({
  columns,
  rows,
  getRowId,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortDir = 'asc',
  onSort,
  onRowClick,
  loading,
  emptyText = 'No results match your filters.',
}: Props<T, K>) {
  return (
    <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
      <LinearProgress
        thickness={2}
        sx={{ visibility: loading ? 'visible' : 'hidden', '--LinearProgress-radius': '0px' }}
      />
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.id} sx={{ width: c.width, fontWeight: 600 }} sortDirection={sortBy === c.sortKey ? sortDir : false}>
                  {c.sortKey && onSort ? (
                    <TableSortLabel
                      active={sortBy === c.sortKey}
                      direction={sortBy === c.sortKey ? sortDir : 'asc'}
                      onClick={() => onSort(c.sortKey as K)}
                    >
                      {c.header}
                    </TableSortLabel>
                  ) : (
                    c.header
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={getRowId(row)}
                hover={!!onRowClick}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((c) => (
                  <TableCell key={c.id}>{c.render(row)}</TableCell>
                ))}
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Typography level="body-sm">{emptyText}</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(_e, p) => onPageChange(p)}
        onRowsPerPageChange={(e) => onPageSizeChange(Number(e.target.value))}
      />
    </Sheet>
  );
}

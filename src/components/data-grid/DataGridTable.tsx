import { useMemo } from 'react';
import Sheet from '@mui/joy/Sheet';
import { DataGrid } from '@mui/x-data-grid';
import type { DataGridProps, GridColDef, GridPaginationModel, GridRowParams, GridSortModel } from '@mui/x-data-grid';
import type { SortDir } from '../../types';

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

interface Props<T extends { id: string }, K extends string> {
  columns: GridColDef<T>[];
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortBy?: K;
  sortDir?: SortDir;
  onSortChange?: (sort: { sortBy: K; sortDir: SortDir } | null) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyText?: string;
  ariaLabel: string;
  /** Extra DataGrid props (row height, slots...). */
  gridProps?: Partial<DataGridProps>;
}

/**
 * Shared, controlled MUI X Data Grid. Sorting and pagination run in "server" mode:
 * the parent owns that state and fetches one page at a time, so the grid never
 * holds the full dataset. Rows are virtualised by the grid itself.
 */
export function DataGridTable<T extends { id: string }, K extends string = string>({
  columns, rows, total, page, pageSize, onPageChange, onPageSizeChange,
  sortBy, sortDir = 'asc', onSortChange, onRowClick, loading, emptyText = 'No results match your filters.', ariaLabel, gridProps,
}: Props<T, K>) {
  const sortModel = useMemo<GridSortModel>(() => (sortBy ? [{ field: sortBy, sort: sortDir }] : []), [sortBy, sortDir]);
  const paginationModel = useMemo<GridPaginationModel>(() => ({ page, pageSize }), [page, pageSize]);

  return (
    <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
      <DataGrid<T>
        aria-label={ariaLabel}
        columns={columns}
        rows={rows}
        rowCount={total}
        loading={loading}
        autoHeight
        disableColumnFilter
        disableColumnMenu
        disableRowSelectionOnClick
        paginationMode="server"
        sortingMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={(m) => {
          if (m.pageSize !== pageSize) onPageSizeChange(m.pageSize);
          else if (m.page !== page) onPageChange(m.page);
        }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        sortModel={sortModel}
        sortingOrder={['asc', 'desc']}
        onSortModelChange={(m) => {
          const first = m[0];
          onSortChange?.(first?.sort ? { sortBy: first.field as K, sortDir: first.sort } : null);
        }}
        onRowClick={onRowClick ? (p: GridRowParams<T>) => onRowClick(p.row) : undefined}
        localeText={{ noRowsLabel: emptyText }}
        sx={{ border: 0, '& .MuiDataGrid-row': { cursor: onRowClick ? 'pointer' : 'default' } }}
        {...gridProps}
      />
    </Sheet>
  );
}

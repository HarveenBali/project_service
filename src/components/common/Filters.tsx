import type { ReactNode } from 'react';
import SearchRounded from '@mui/icons-material/SearchRounded';
import Box from '@mui/joy/Box';
import Chip from '@mui/joy/Chip';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Option from '@mui/joy/Option';
import Select from '@mui/joy/Select';

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <FormControl size="sm" sx={{ minWidth: 220, flexGrow: 1, maxWidth: 360 }}>
      <FormLabel>Search</FormLabel>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} startDecorator={<SearchRounded />} />
    </FormControl>
  );
}

export function MultiSelectFilter<T extends string>({
  label, options, value, onChange,
}: { label: string; options: FilterOption<T>[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <FormControl size="sm" sx={{ minWidth: 170 }}>
      <FormLabel>{label}</FormLabel>
      <Select
        multiple
        placeholder="All"
        value={value}
        onChange={(_e, v) => onChange(v as T[])}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {selected.map((s) => (
              <Chip key={s.value} size="sm" variant="soft">{s.label}</Chip>
            ))}
          </Box>
        )}
      >
        {options.map((o) => (
          <Option key={o.value} value={o.value}>{o.label}</Option>
        ))}
      </Select>
    </FormControl>
  );
}

/** Single select where `'all'` means "no filter". */
export function SelectFilter({
  label, options, value, onChange, allLabel = 'All',
}: { label: string; options: FilterOption[]; value: string; onChange: (v: string) => void; allLabel?: string }) {
  return (
    <FormControl size="sm" sx={{ minWidth: 170 }}>
      <FormLabel>{label}</FormLabel>
      <Select value={value} onChange={(_e, v) => onChange(v ?? 'all')}>
        <Option value="all">{allLabel}</Option>
        {options.map((o) => (
          <Option key={o.value} value={o.value}>{o.label}</Option>
        ))}
      </Select>
    </FormControl>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-end', mb: 2 }}>{children}</Box>;
}

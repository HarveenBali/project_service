import type { ReactNode } from 'react';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import LinearProgress from '@mui/joy/LinearProgress';
import Typography from '@mui/joy/Typography';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { TASK_STATUSES } from '../../constants';
import type { WorkloadRow } from '../../features/reports/analytics';
import type { TaskStatus } from '../../types';

export function ChartCard({ title, subtitle, children, height = 280 }: { title: string; subtitle?: string; children: ReactNode; height?: number }) {
  return (
    <Card variant="outlined" component="section" aria-label={title}>
      <Box>
        <Typography level="title-md" component="h2">{title}</Typography>
        {subtitle && <Typography level="body-xs">{subtitle}</Typography>}
      </Box>
      <Box sx={{ height, width: '100%', minWidth: 0 }}>{children}</Box>
    </Card>
  );
}

interface Slice {
  key: string;
  name: string;
  value: number;
  fill: string;
}

function EmptyChart() {
  return (
    <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
      <Typography level="body-sm">No data yet.</Typography>
    </Box>
  );
}

export function DonutChart({ data, onSliceClick }: { data: Slice[]; onSliceClick?: (key: string) => void }) {
  if (data.every((d) => d.value === 0)) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          cursor={onSliceClick ? 'pointer' : undefined}
          onClick={(slice) => onSliceClick?.((slice as unknown as Slice).key)}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.fill} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({ data }: { data: Slice[] }) {
  if (data.every((d) => d.value === 0)) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WorkloadChart({ data }: { data: WorkloadRow[] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        {TASK_STATUSES.map((s) => (
          <Bar key={s.value} dataKey={s.value as TaskStatus} name={s.label} stackId="a" fill={s.hex} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data }: { data: { week: string; created: number; completed: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
        <XAxis dataKey="week" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="created" name="Created" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface ProgressRow {
  id: string;
  name: string;
  done: number;
  total: number;
  percent: number;
  overdue: number;
}

export function ProgressList({ rows, onSelect }: { rows: ProgressRow[]; onSelect?: (id: string) => void }) {
  if (rows.length === 0) return <EmptyChart />;
  return (
    <Box sx={{ display: 'grid', gap: 1.5, overflowY: 'auto', height: '100%', alignContent: 'start' }}>
      {rows.map((r) => (
        <Box
          key={r.id}
          onClick={() => onSelect?.(r.id)}
          role={onSelect ? 'link' : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onKeyDown={onSelect ? (e) => e.key === 'Enter' && onSelect(r.id) : undefined}
          sx={{ cursor: onSelect ? 'pointer' : 'default' }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography level="body-sm">{r.name}</Typography>
            <Typography level="body-xs">{r.done}/{r.total} done{r.overdue ? ` · ${r.overdue} overdue` : ''}</Typography>
          </Box>
          <LinearProgress determinate value={r.percent} color={r.overdue ? 'warning' : 'success'} sx={{ mt: 0.5 }} />
        </Box>
      ))}
    </Box>
  );
}

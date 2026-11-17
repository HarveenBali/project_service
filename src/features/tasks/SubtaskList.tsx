import { useState } from 'react';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Checkbox from '@mui/joy/Checkbox';
import IconButton from '@mui/joy/IconButton';
import Input from '@mui/joy/Input';
import LinearProgress from '@mui/joy/LinearProgress';
import Typography from '@mui/joy/Typography';
import type { Subtask } from '../../types';

interface Props {
  subtasks: Subtask[];
  disabled?: boolean;
  onChange: (next: Subtask[]) => void;
}

export function SubtaskList({ subtasks, disabled, onChange }: Props) {
  const [title, setTitle] = useState('');
  const done = subtasks.filter((s) => s.done).length;

  const add = () => {
    const text = title.trim();
    if (!text) return;
    onChange([...subtasks, { id: `st-${Date.now().toString(36)}`, title: text, done: false }]);
    setTitle('');
  };

  return (
    <Box component="section" aria-label="Subtasks" sx={{ display: 'grid', gap: 1 }}>
      <Typography level="title-md" component="h3">Subtasks ({done}/{subtasks.length})</Typography>
      {subtasks.length > 0 && <LinearProgress determinate value={(done / subtasks.length) * 100} color="success" />}
      {subtasks.map((s) => (
        <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Checkbox
            size="sm"
            label={s.title}
            checked={s.done}
            disabled={disabled}
            onChange={(e) => onChange(subtasks.map((x) => (x.id === s.id ? { ...x, done: e.target.checked } : x)))}
            sx={{ '& label': { textDecoration: s.done ? 'line-through' : 'none' } }}
          />
          {!disabled && (
            <IconButton size="sm" variant="plain" color="neutral" aria-label={`Remove subtask ${s.title}`} onClick={() => onChange(subtasks.filter((x) => x.id !== s.id))}>
              <DeleteOutlineRounded fontSize="small" />
            </IconButton>
          )}
        </Box>
      ))}
      {!disabled && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Input size="sm" placeholder="Add a subtask" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} sx={{ flexGrow: 1 }} slotProps={{ input: { 'aria-label': 'New subtask' } }} />
          <Button size="sm" variant="outlined" onClick={add}>Add</Button>
        </Box>
      )}
    </Box>
  );
}

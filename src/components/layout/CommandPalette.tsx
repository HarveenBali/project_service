import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '@mui/joy/Input';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import Typography from '@mui/joy/Typography';
import { useColorScheme } from '@mui/joy/styles';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setPaletteOpen } from '../../app/uiSlice';
import { useScopedData } from '../../hooks/useScopedData';
import { usePermissions } from '../../hooks/usePermissions';
import { NAV_ITEMS } from './navigation';

interface Command {
  id: string;
  group: 'Navigate' | 'Actions' | 'Projects' | 'Tasks';
  label: string;
  hint?: string;
  run: () => void;
}

/** Ctrl/Cmd + K: search and jump anywhere, or trigger common actions. */
export function CommandPalette() {
  const open = useAppSelector((s) => s.ui.paletteOpen);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { projects, tasks, projectById } = useScopedData();
  const { mode, systemMode, setMode } = useColorScheme();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const close = () => dispatch(setPaletteOpen(false));

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => { close(); navigate(to); };
    const dark = (mode === 'system' ? systemMode : mode) === 'dark';
    const list: Command[] = [
      ...NAV_ITEMS.filter((n) => !n.requires || can(n.requires)).map<Command>((n) => ({ id: `nav-${n.to}`, group: 'Navigate', label: n.label, run: go(n.to) })),
      { id: 'theme', group: 'Actions', label: dark ? 'Switch to light theme' : 'Switch to dark theme', run: () => { setMode(dark ? 'light' : 'dark'); close(); } },
      ...(can('task:create') ? [{ id: 'new-task', group: 'Actions' as const, label: 'Create task', run: go('/tasks?new=1') }] : []),
      ...(can('project:create') ? [{ id: 'new-project', group: 'Actions' as const, label: 'Create project', run: go('/projects?new=1') }] : []),
      ...projects.map<Command>((p) => ({ id: `p-${p.id}`, group: 'Projects', label: p.name, run: go(`/projects/${p.id}`) })),
      ...tasks.map<Command>((t) => ({ id: `t-${t.id}`, group: 'Tasks', label: t.title, hint: projectById.get(t.projectId)?.name, run: go(`/tasks?open=${t.id}`) })),
    ];
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, tasks, projectById, can, mode, systemMode, navigate]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q ? commands.filter((c) => `${c.label} ${c.hint ?? ''}`.toLowerCase().includes(q)) : commands.filter((c) => c.group !== 'Tasks');
    return matches.slice(0, 12);
  }, [commands, query]);

  useEffect(() => { setActive(0); }, [query, open]);
  useEffect(() => { if (open) setQuery(''); }, [open]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); results[active]?.run(); }
  };

  return (
    <Modal open={open} onClose={close}>
      <ModalDialog layout="center" sx={{ width: 'min(560px, 92vw)', p: 1.5, alignSelf: 'flex-start', mt: '12vh' }} aria-label="Command palette">
        <Input
          autoFocus
          placeholder="Search projects, tasks and actions…"
          startDecorator={<SearchRounded />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          slotProps={{ input: { role: 'combobox', 'aria-expanded': true, 'aria-controls': 'palette-list', 'aria-label': 'Search commands' } }}
        />
        <List id="palette-list" role="listbox" ref={listRef} size="sm" sx={{ maxHeight: 360, overflow: 'auto', mt: 1 }}>
          {results.length === 0 && <Typography level="body-sm" sx={{ p: 2, textAlign: 'center' }}>No matches.</Typography>}
          {results.map((r, i) => (
            <ListItem key={r.id}>
              <ListItemButton role="option" aria-selected={i === active} selected={i === active} onMouseMove={() => setActive(i)} onClick={r.run}>
                <ListItemContent>
                  <Typography level="body-sm">{r.label}</Typography>
                  {r.hint && <Typography level="body-xs">{r.hint}</Typography>}
                </ListItemContent>
                <Typography level="body-xs">{r.group}</Typography>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </ModalDialog>
    </Modal>
  );
}

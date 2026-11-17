import { memo, useCallback, useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AddRounded from '@mui/icons-material/AddRounded';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import { TASK_STATUSES } from '../../constants';
import type { Task, TaskStatus, User } from '../../types';
import { TaskCard } from './TaskCard';
import { useMoveTaskMutation } from '../tasks/tasksApi';

const isStatus = (id: unknown): id is TaskStatus => TASK_STATUSES.some((s) => s.value === id);

const SortableTask = memo(function SortableTask({ task, assignee, disabled, onOpen }: {
  task: Task; assignee?: User; disabled: boolean; onOpen: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1, cursor: disabled ? 'pointer' : 'grab', touchAction: 'manipulation' }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        // Enter opens the task; Space (handled by dnd-kit) starts a keyboard drag.
        if (e.key === 'Enter') onOpen(task);
        else listeners?.onKeyDown?.(e);
      }}
      aria-label={`${task.title}. ${disabled ? 'Press Enter to open.' : 'Press Enter to open, Space to pick up and move.'}`}
    >
      <TaskCard task={task} assignee={assignee} />
    </div>
  );
});

function Column({ status, tasks, userById, canDrag, dragDisabled, onOpen, onAdd }: {
  status: (typeof TASK_STATUSES)[number];
  tasks: Task[];
  userById: Map<string, User>;
  canDrag: (t: Task) => boolean;
  dragDisabled?: boolean;
  onOpen: (t: Task) => void;
  onAdd?: (s: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value });
  return (
    <Sheet variant="soft" component="section" aria-label={`${status.label} column, ${tasks.length} tasks`} sx={{ borderRadius: 'md', p: 1.5, minHeight: 320 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography level="title-sm" color={status.color} component="h3">{status.label} · {tasks.length}</Typography>
        {onAdd && (
          <IconButton size="sm" variant="plain" aria-label={`Add task to ${status.label}`} onClick={() => onAdd(status.value)}>
            <AddRounded />
          </IconButton>
        )}
      </Box>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <Box
          ref={setNodeRef}
          sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 240, borderRadius: 'sm', transition: 'background-color .15s', bgcolor: isOver ? 'background.level2' : 'transparent' }}
        >
          {tasks.map((t) => (
            <SortableTask key={t.id} task={t} assignee={t.assigneeId ? userById.get(t.assigneeId) : undefined} disabled={!!dragDisabled || !canDrag(t)} onOpen={onOpen} />
          ))}
        </Box>
      </SortableContext>
    </Sheet>
  );
}

interface Props {
  projectId: string;
  tasks: Task[];
  userById: Map<string, User>;
  onOpenTask: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
  /** Disable dragging, e.g. while a filter hides part of a column. */
  dragDisabled?: boolean;
  canDrag: (task: Task) => boolean;
}

export function KanbanBoard({ projectId, tasks, userById, onOpenTask, onAddTask, dragDisabled, canDrag }: Props) {
  const [moveTask] = useMoveTaskMutation();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    // A small distance lets a plain click open the task instead of starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columns = useMemo(() => {
    const byStatus = new Map<TaskStatus, Task[]>(TASK_STATUSES.map((s) => [s.value, []]));
    for (const t of tasks) byStatus.get(t.status)?.push(t);
    byStatus.forEach((list) => list.sort((a, b) => a.order - b.order));
    return byStatus;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : undefined;

  const onDragStart = useCallback((e: DragStartEvent) => setActiveId(String(e.active.id)), []);

  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      setActiveId(null);
      if (!over) return;
      const task = tasks.find((t) => t.id === active.id);
      if (!task) return;

      let status: TaskStatus;
      let index: number;
      if (isStatus(over.id)) {
        // Dropped on empty column space: append.
        status = over.id;
        index = (columns.get(status) ?? []).filter((t) => t.id !== task.id).length;
      } else {
        const target = tasks.find((t) => t.id === over.id);
        if (!target) return;
        status = target.status;
        const column = columns.get(status) ?? [];
        if (status === task.status) {
          index = column.findIndex((t) => t.id === target.id);
          if (index === column.findIndex((t) => t.id === task.id)) return;
        } else {
          const without = column.filter((t) => t.id !== task.id);
          const translated = active.rect.current.translated;
          const below = !!translated && translated.top > over.rect.top + over.rect.height / 2;
          index = without.findIndex((t) => t.id === target.id) + (below ? 1 : 0);
        }
      }
      void moveTask({ id: task.id, projectId, status, index });
    },
    [tasks, columns, moveTask, projectId],
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(250px, 1fr))', gap: 2, overflowX: 'auto', pb: 1 }}>
        {TASK_STATUSES.map((status) => (
          <Column
            key={status.value}
            status={status}
            tasks={columns.get(status.value) ?? []}
            userById={userById}
            canDrag={canDrag}
            dragDisabled={dragDisabled}
            onOpen={onOpenTask}
            onAdd={onAddTask}
          />
        ))}
      </Box>
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} assignee={activeTask.assigneeId ? userById.get(activeTask.assigneeId) : undefined} dragging />}
      </DragOverlay>
    </DndContext>
  );
}

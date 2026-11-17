import { memo, useCallback, useMemo } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import AddRounded from '@mui/icons-material/AddRounded';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import IconButton from '@mui/joy/IconButton';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import { TASK_STATUSES } from '../constants';
import { useMoveTaskMutation } from '../store/api';
import type { Task, TaskStatus, User } from '../types';
import { formatDate, isOverdue } from '../utils/format';
import { PriorityChip } from './Chips';
import { UserAvatar } from './UserAvatar';

interface CardProps {
  task: Task;
  assignee?: User;
  onOpen: (task: Task) => void;
}

const TaskCard = memo(function TaskCard({ task, assignee, onOpen }: CardProps) {
  const overdue = isOverdue(task);
  return (
    <Card
      variant="outlined"
      size="sm"
      onClick={() => onOpen(task)}
      sx={{ gap: 1, cursor: 'pointer', '&:hover': { boxShadow: 'sm' } }}
    >
      <Typography level="title-sm">{task.title}</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PriorityChip priority={task.priority} />
        <UserAvatar user={assignee} />
      </Box>
      <Typography level="body-xs" color={overdue ? 'danger' : 'neutral'}>
        {overdue ? 'Overdue · ' : 'Due '}
        {formatDate(task.dueDate)}
      </Typography>
    </Card>
  );
});

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

  const columns = useMemo(() => {
    const byStatus = new Map<TaskStatus, Task[]>(TASK_STATUSES.map((s) => [s.value, []]));
    for (const t of tasks) byStatus.get(t.status)?.push(t);
    byStatus.forEach((list) => list.sort((a, b) => a.order - b.order));
    return byStatus;
  }, [tasks]);

  const onDragEnd = useCallback(
    ({ draggableId, source, destination }: DropResult) => {
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;
      void moveTask({
        id: draggableId,
        projectId,
        status: destination.droppableId as TaskStatus,
        index: destination.index,
      });
    },
    [moveTask, projectId],
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(4, minmax(250px, 1fr))' },
          gap: 2,
          overflowX: 'auto',
          pb: 1,
        }}
      >
        {TASK_STATUSES.map((status) => {
          const list = columns.get(status.value) ?? [];
          return (
            <Sheet key={status.value} variant="soft" sx={{ borderRadius: 'md', p: 1.5, minHeight: 320 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography level="title-sm" color={status.color}>
                  {status.label} · {list.length}
                </Typography>
                {onAddTask && (
                  <IconButton size="sm" variant="plain" aria-label={`Add task to ${status.label}`} onClick={() => onAddTask(status.value)}>
                    <AddRounded />
                  </IconButton>
                )}
              </Box>
              <Droppable droppableId={status.value}>
                {(drop, snapshot) => (
                  <Box
                    ref={drop.innerRef}
                    {...drop.droppableProps}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      minHeight: 240,
                      borderRadius: 'sm',
                      transition: 'background-color .15s',
                      bgcolor: snapshot.isDraggingOver ? 'background.level2' : 'transparent',
                    }}
                  >
                    {list.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                        isDragDisabled={dragDisabled || !canDrag(task)}
                      >
                        {(drag) => (
                          <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}>
                            <TaskCard task={task} assignee={task.assigneeId ? userById.get(task.assigneeId) : undefined} onOpen={onOpenTask} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {drop.placeholder}
                  </Box>
                )}
              </Droppable>
            </Sheet>
          );
        })}
      </Box>
    </DragDropContext>
  );
}

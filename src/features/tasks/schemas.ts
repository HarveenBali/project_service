import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(120, 'Keep the title under 120 characters.'),
  description: z.string().max(2000, 'Description is too long.'),
  projectId: z.string().min(1, 'Select a project.'),
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assigneeId: z.string(), // '' = unassigned
  dueDate: z.string().min(1, 'Choose a due date.'),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'Write a comment first.').max(1000, 'Comment is too long.'),
});

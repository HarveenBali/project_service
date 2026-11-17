import { useState } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Textarea from '@mui/joy/Textarea';
import Typography from '@mui/joy/Typography';
import { ErrorState } from '../../components/feedback/Feedback';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useToast } from '../../hooks/useToast';
import { errorMessage } from '../../services/api';
import type { User } from '../../types';
import { timeAgo } from '../../utils/format';
import { useAddCommentMutation, useGetCommentsQuery } from './tasksApi';
import { commentSchema } from './schemas';

/** Task discussion. Typing @FirstName notifies that teammate. */
export function TaskComments({ taskId, userById }: { taskId: string; userById: Map<string, User> }) {
  const { data = [], isLoading, isError, refetch } = useGetCommentsQuery(taskId);
  const [addComment, { isLoading: posting }] = useAddCommentMutation();
  const toast = useToast();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const parsed = commentSchema.safeParse({ body });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError(null);
    try {
      await addComment({ taskId, body: parsed.data.body }).unwrap();
      setBody('');
    } catch (e) {
      toast.error(errorMessage(e, 'Could not post the comment.'));
    }
  };

  return (
    <Box component="section" aria-label="Comments" sx={{ display: 'grid', gap: 1.5 }}>
      <Typography level="title-md" component="h3">Comments ({data.length})</Typography>
      {isError && <ErrorState message="Could not load comments." onRetry={() => void refetch()} />}
      {!isLoading && data.length === 0 && !isError && <Typography level="body-sm">No comments yet.</Typography>}
      {data.map((c) => (
        <Box key={c.id} sx={{ display: 'flex', gap: 1 }}>
          <UserAvatar user={userById.get(c.authorId)} />
          <Box>
            <Typography level="title-sm">
              {userById.get(c.authorId)?.name ?? 'Unknown'} <Typography level="body-xs" component="span">· {timeAgo(c.createdAt)}</Typography>
            </Typography>
            <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap' }}>{c.body}</Typography>
          </Box>
        </Box>
      ))}
      <Textarea
        minRows={2}
        placeholder="Write a comment. Use @Name to mention someone."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        error={!!error}
        slotProps={{ textarea: { 'aria-label': 'New comment' } }}
        onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') void submit(); }}
      />
      {error && <Typography level="body-xs" color="danger" role="alert">{error}</Typography>}
      <Button size="sm" onClick={submit} loading={posting} sx={{ justifySelf: 'start' }}>Comment</Button>
    </Box>
  );
}

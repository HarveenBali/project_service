import { useEffect } from 'react';
import Alert from '@mui/joy/Alert';
import IconButton from '@mui/joy/IconButton';
import Stack from '@mui/joy/Stack';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { dismissToast } from '../../app/uiSlice';
import type { Toast } from '../../app/uiSlice';

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const id = setTimeout(() => dispatch(dismissToast(toast.id)), 4000);
    return () => clearTimeout(id);
  }, [dispatch, toast.id]);

  return (
    <Alert
      variant="soft"
      color={toast.severity}
      role={toast.severity === 'danger' ? 'alert' : 'status'}
      endDecorator={
        <IconButton size="sm" variant="plain" color={toast.severity} aria-label="Dismiss" onClick={() => dispatch(dismissToast(toast.id))}>
          <CloseRounded />
        </IconButton>
      }
      sx={{ boxShadow: 'md', minWidth: 260 }}
    >
      {toast.message}
    </Alert>
  );
}

export function ToastHost() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  return (
    <Stack spacing={1} aria-live="polite" sx={{ position: 'fixed', right: 16, bottom: 16, zIndex: 2000 }}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </Stack>
  );
}

import { useMemo } from 'react';
import { useAppDispatch } from '../app/hooks';
import { toast } from '../app/uiSlice';
import type { ToastSeverity } from '../app/uiSlice';

export function useToast() {
  const dispatch = useAppDispatch();
  return useMemo(
    () => ({
      show: (message: string, severity: ToastSeverity = 'success') => dispatch(toast(message, severity)),
      error: (message: string) => dispatch(toast(message, 'danger')),
    }),
    [dispatch],
  );
}

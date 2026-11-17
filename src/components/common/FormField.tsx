import { forwardRef } from 'react';
import type { InputProps } from '@mui/joy/Input';
import FormControl from '@mui/joy/FormControl';
import FormHelperText from '@mui/joy/FormHelperText';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';

interface Props extends Omit<InputProps, 'error'> {
  label: string;
  error?: string;
  helper?: string;
}

/** Labelled Joy input that works with react-hook-form's `register()` and exposes errors to screen readers. */
export const FormField = forwardRef<HTMLInputElement, Props>(function FormField({ label, error, helper, ...rest }, ref) {
  return (
    <FormControl error={!!error}>
      <FormLabel>{label}</FormLabel>
      <Input {...rest} slotProps={{ input: { ref, 'aria-invalid': !!error } }} />
      {(error || helper) && (
        <FormHelperText role={error ? 'alert' : undefined}>{error ?? helper}</FormHelperText>
      )}
    </FormControl>
  );
});

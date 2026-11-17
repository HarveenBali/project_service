import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Link from '@mui/joy/Link';
import { FormField } from '../../components/common/FormField';
import { errorMessage } from '../../services/api';
import { useRequestPasswordResetMutation } from './authApi';
import { AuthLayout } from './AuthLayout';
import { resetSchema } from './schemas';
import type { ResetValues } from './schemas';

export default function ForgotPasswordPage() {
  const [request, { isLoading }] = useRequestPasswordResetMutation();
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ResetValues) => {
    setFormError(null);
    try {
      await request(values).unwrap();
      setSent(true);
    } catch (e) {
      setFormError(errorMessage(e));
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We will email you a link to choose a new one.">
      {sent ? (
        <Alert color="success" role="status">
          If an account exists for that email, a reset link is on its way. This demo does not send real email.
        </Alert>
      ) : (
        <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ display: 'grid', gap: 2 }}>
          {formError && <Alert color="danger" role="alert">{formError}</Alert>}
          <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Button type="submit" loading={isLoading}>Send reset link</Button>
        </Box>
      )}
      <Link component={RouterLink} to="/login" level="body-sm">Back to sign in</Link>
    </AuthLayout>
  );
}

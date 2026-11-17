import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import Link from '@mui/joy/Link';
import Typography from '@mui/joy/Typography';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { FormField } from '../../components/common/FormField';
import { errorMessage } from '../../services/api';
import { DEMO_PASSWORD } from '../../services/mock/seed';
import { useLoginMutation } from './authApi';
import { AuthLayout } from './AuthLayout';
import { signedIn } from './authSlice';
import { loginSchema } from './schemas';
import type { LoginValues } from './schemas';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@flowsync.dev' },
  { label: 'Manager', email: 'manager@flowsync.dev' },
  { label: 'Member', email: 'member@flowsync.dev' },
];

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, expired } = useAppSelector((s) => s.auth);
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (session) return <Navigate to={from} replace />;

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      dispatch(signedIn(await login(values).unwrap()));
      navigate(from, { replace: true });
    } catch (e) {
      setFormError(errorMessage(e, 'Could not sign in.'));
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back. Enter your details to continue.">
      {expired && <Alert color="warning">Your session expired. Please sign in again.</Alert>}
      {formError && <Alert color="danger" role="alert">{formError}</Alert>}
      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ display: 'grid', gap: 2 }}>
        <FormField label="Email" type="email" autoComplete="username" error={errors.email?.message} {...register('email')} />
        <FormField label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" loading={isLoading}>Sign in</Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Link component={RouterLink} to="/forgot-password" level="body-sm">Forgot password?</Link>
        <Link component={RouterLink} to="/signup" level="body-sm">Create an account</Link>
      </Box>
      <Divider>Demo accounts</Divider>
      <Typography level="body-xs">Password for every demo account: {DEMO_PASSWORD}</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {DEMO_ACCOUNTS.map((a) => (
          <Button
            key={a.email}
            size="sm"
            variant="outlined"
            color="neutral"
            onClick={() => {
              setValue('email', a.email, { shouldValidate: true });
              setValue('password', DEMO_PASSWORD, { shouldValidate: true });
            }}
          >
            {a.label}
          </Button>
        ))}
      </Box>
    </AuthLayout>
  );
}

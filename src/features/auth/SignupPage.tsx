import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Link from '@mui/joy/Link';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { FormField } from '../../components/common/FormField';
import { errorMessage } from '../../services/api';
import { useSignupMutation } from './authApi';
import { AuthLayout } from './AuthLayout';
import { signedIn } from './authSlice';
import { signupSchema } from './schemas';
import type { SignupValues } from './schemas';

export default function SignupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const session = useAppSelector((s) => s.auth.session);
  const [signup, { isLoading }] = useSignupMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  if (session) return <Navigate to="/" replace />;

  const onSubmit = async ({ name, email, password }: SignupValues) => {
    setFormError(null);
    try {
      dispatch(signedIn(await signup({ name, email, password }).unwrap()));
      navigate('/', { replace: true });
    } catch (e) {
      setFormError(errorMessage(e, 'Could not create the account.'));
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="New accounts start with the Member role.">
      {formError && <Alert color="danger" role="alert">{formError}</Alert>}
      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ display: 'grid', gap: 2 }}>
        <FormField label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <FormField label="Password" type="password" autoComplete="new-password" helper="8+ characters with upper, lower case and a number." error={errors.password?.message} {...register('password')} />
        <FormField label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" loading={isLoading}>Create account</Button>
      </Box>
      <Link component={RouterLink} to="/login" level="body-sm">Already have an account? Sign in</Link>
    </AuthLayout>
  );
}

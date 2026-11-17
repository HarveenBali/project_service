import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import Chip from '@mui/joy/Chip';
import Table from '@mui/joy/Table';
import ToggleButtonGroup from '@mui/joy/ToggleButtonGroup';
import Typography from '@mui/joy/Typography';
import { useColorScheme } from '@mui/joy/styles';
import { useAppDispatch } from '../../app/hooks';
import { FormField } from '../../components/common/FormField';
import { PageHeader } from '../../components/common/PageHeader';
import { ROLE_LABEL } from '../../constants';
import { useCurrentUser } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { errorMessage } from '../../services/api';
import { resetDb } from '../../services/mock/state';
import type { Role } from '../../types';
import { ALL_ACTIONS, PERMISSION_MATRIX } from '../../utils/permissions';
import { profileUpdated } from '../auth/authSlice';
import { useUpdateUserMutation } from '../team/usersApi';

const profileSchema = z.object({ name: z.string().trim().min(2, 'Enter your full name.').max(60, 'Name is too long.') });
type ProfileValues = z.infer<typeof profileSchema>;

const ROLES: Role[] = ['admin', 'manager', 'member'];

export default function SettingsPage() {
  const user = useCurrentUser();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { mode, setMode } = useColorScheme();
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name },
  });
  useEffect(() => reset({ name: user.name }), [user.name, reset]);

  const onSubmit = async ({ name }: ProfileValues) => {
    setFormError(null);
    try {
      const updated = await updateUser({ id: user.id, patch: { name } }).unwrap();
      dispatch(profileUpdated(updated));
      toast.show('Profile saved');
    } catch (e) {
      setFormError(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile, appearance and the permissions each role has." />
      <Box sx={{ display: 'grid', gap: 2, maxWidth: 820 }}>
        <Card variant="outlined" component="section" aria-label="Profile">
          <Typography level="title-md" component="h2">Profile</Typography>
          <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} sx={{ display: 'grid', gap: 2, maxWidth: 420 }}>
            <FormField label="Full name" error={errors.name?.message ?? formError ?? undefined} {...register('name')} />
            <FormField label="Email" value={user.email} disabled readOnly helper="Email changes are not available in this demo." />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button type="submit" loading={isLoading} disabled={!isDirty}>Save</Button>
              <Chip variant="soft" size="sm">{ROLE_LABEL[user.role]}</Chip>
            </Box>
          </Box>
        </Card>

        <Card variant="outlined" component="section" aria-label="Appearance">
          <Typography level="title-md" component="h2">Appearance</Typography>
          <ToggleButtonGroup value={mode ?? 'system'} onChange={(_e, v) => v && setMode(v)} aria-label="Colour theme">
            <Button value="light">Light</Button>
            <Button value="dark">Dark</Button>
            <Button value="system">System</Button>
          </ToggleButtonGroup>
        </Card>

        <Card variant="outlined" component="section" aria-label="Roles and permissions" sx={{ overflow: 'auto' }}>
          <Typography level="title-md" component="h2">Roles and permissions</Typography>
          <Table size="sm" aria-label="Permissions by role">
            <thead>
              <tr><th>Permission</th>{ROLES.map((r) => <th key={r}>{ROLE_LABEL[r]}</th>)}</tr>
            </thead>
            <tbody>
              {ALL_ACTIONS.map((a) => (
                <tr key={a}>
                  <td>{a.replace(':', ' › ')}</td>
                  {ROLES.map((r) => <td key={r} aria-label={PERMISSION_MATRIX[r].includes(a) ? 'Allowed' : 'Not allowed'}>{PERMISSION_MATRIX[r].includes(a) ? '✓' : '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card variant="outlined" component="section" aria-label="Demo data">
          <Typography level="title-md" component="h2">Demo data</Typography>
          <Typography level="body-sm">All data lives in this browser. Reset restores the original sample workspace and signs you out.</Typography>
          <Button
            color="danger"
            variant="outlined"
            sx={{ justifySelf: 'start' }}
            onClick={() => {
              if (!window.confirm('Reset all demo data?')) return;
              resetDb();
              localStorage.removeItem('flowsync-session');
              window.location.assign('/login');
            }}
          >
            Reset demo data
          </Button>
        </Card>
      </Box>
    </>
  );
}

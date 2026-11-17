import type { ReactNode } from 'react';
import AssignmentRounded from '@mui/icons-material/AssignmentRounded';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import FolderRounded from '@mui/icons-material/FolderRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import InsightsRounded from '@mui/icons-material/InsightsRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import type { Action } from '../../utils/permissions';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  requires?: Action;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardRounded /> },
  { to: '/projects', label: 'Projects', icon: <FolderRounded /> },
  { to: '/tasks', label: 'Tasks', icon: <AssignmentRounded /> },
  { to: '/team', label: 'Team', icon: <GroupsRounded />, requires: 'team:view' },
  { to: '/reports', label: 'Reports', icon: <InsightsRounded />, requires: 'analytics:view' },
  { to: '/settings', label: 'Settings', icon: <SettingsRounded /> },
];

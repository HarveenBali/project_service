import { Link as RouterLink, useLocation } from 'react-router-dom';
import Breadcrumbs from '@mui/joy/Breadcrumbs';
import Link from '@mui/joy/Link';
import Typography from '@mui/joy/Typography';
import { useGetProjectsQuery } from '../../features/projects/projectsApi';
import { NAV_ITEMS } from './navigation';

export function AppBreadcrumbs() {
  const { pathname } = useLocation();
  const { data: projects = [] } = useGetProjectsQuery();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return <Typography level="title-sm">Dashboard</Typography>;

  const crumbs = segments.map((seg, i) => {
    const to = `/${segments.slice(0, i + 1).join('/')}`;
    const nav = NAV_ITEMS.find((n) => n.to === to);
    const project = segments[0] === 'projects' && i === 1 ? projects.find((p) => p.id === seg) : undefined;
    return { to, label: nav?.label ?? project?.name ?? seg };
  });

  return (
    <Breadcrumbs size="sm" sx={{ p: 0 }} aria-label="Breadcrumb">
      <Link component={RouterLink} to="/" color="neutral">Home</Link>
      {crumbs.map((c, i) =>
        i === crumbs.length - 1 ? (
          <Typography key={c.to} aria-current="page">{c.label}</Typography>
        ) : (
          <Link key={c.to} component={RouterLink} to={c.to} color="neutral">{c.label}</Link>
        ),
      )}
    </Breadcrumbs>
  );
}
